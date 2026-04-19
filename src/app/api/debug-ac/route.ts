import { NextRequest, NextResponse } from 'next/server';

/**
 * TEMPORÁRIO — endpoint de diagnóstico da integração ActiveCampaign.
 *
 * Remover após validar fluxo de custom fields.
 *
 * GET /api/debug-ac?key=<token_derivado_da_ACTIVECAMPAIGN_API_KEY>
 *
 * Testa em ordem:
 * 1. Env vars
 * 2. Ping /users/me
 * 3. Listar fields (ver perstags existentes)
 * 4. Contact sync com email teste
 * 5. setContactFields direto pra ver erro exato
 */

export const dynamic = 'force-dynamic';

type StepResult = {
  step: string;
  ok: boolean;
  httpStatus?: number;
  responseSnippet?: string;
  error?: string;
  durationMs?: number;
};

async function isAuthorized(key: string | null): Promise<boolean> {
  if (!key) return false;

  const acKey = process.env.ACTIVECAMPAIGN_API_KEY;
  if (!acKey) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(`boldfy-debug-ac-${acKey}`);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  const hashArr = Array.from(new Uint8Array(hashBuf));
  const hashHex = hashArr.map((b) => b.toString(16).padStart(2, '0')).join('');
  const derived = hashHex.slice(-12);
  return key === derived;
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('key');
  const AC_URL = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

  const keyFingerprint = AC_KEY
    ? `${AC_KEY.slice(0, 8)}...${AC_KEY.slice(-4)} (len=${AC_KEY.length})`
    : 'not_set';

  const authorized = await isAuthorized(secret);
  if (!authorized) {
    return NextResponse.json(
      {
        error: 'unauthorized',
        publicFingerprint: {
          AC_URL: AC_URL ?? 'not_set',
          AC_KEY: keyFingerprint,
        },
      },
      { status: 401 },
    );
  }

  if (!AC_URL || !AC_KEY) {
    return NextResponse.json({ error: 'env_vars_missing' });
  }

  const steps: StepResult[] = [];
  const headers = {
    'Api-Token': AC_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Step 1: list existing fields — pra ver perstags que o AC tem
  const t1 = Date.now();
  try {
    const res = await fetch(`${AC_URL}/api/3/fields?limit=100`, { headers });
    const txt = await res.text();
    let existingFields = null;
    try {
      const parsed = JSON.parse(txt);
      existingFields = (parsed.fields ?? []).map(
        (f: { id: string; title: string; perstag: string; type: string }) => ({
          id: f.id,
          title: f.title,
          perstag: f.perstag,
          type: f.type,
        }),
      );
    } catch {
      /* ignore */
    }
    steps.push({
      step: '1_list_fields',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: JSON.stringify(existingFields),
      durationMs: Date.now() - t1,
    });
  } catch (err) {
    steps.push({
      step: '1_list_fields',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t1,
    });
  }

  // Step 2: create test contact
  const testEmail = `diag-fields-${Date.now()}@boldfy-debug.dev`;
  const t2 = Date.now();
  let contactId: string | null = null;
  try {
    const res = await fetch(`${AC_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact: {
          email: testEmail,
          firstName: 'Diagnostic',
          lastName: 'Fields',
          phone: '',
        },
      }),
    });
    const txt = await res.text();
    try {
      const parsed = JSON.parse(txt);
      contactId = parsed.contact?.id ?? null;
    } catch {
      /* ignore */
    }
    steps.push({
      step: '2_create_contact',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: `contactId: ${contactId ?? 'null'} | ${txt.substring(0, 300)}`,
      durationMs: Date.now() - t2,
    });
  } catch (err) {
    steps.push({
      step: '2_create_contact',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t2,
    });
  }

  if (!contactId) {
    return NextResponse.json({ steps, conclusion: 'contact_creation_failed' });
  }

  // Step 3: set field value (tentativa com perstag EMPRESA — que deve existir)
  // Primeiro lista fields e acha o id do perstag EMPRESA
  let empresaFieldId: string | null = null;
  try {
    const res = await fetch(`${AC_URL}/api/3/fields?limit=100`, { headers });
    if (res.ok) {
      const data = await res.json();
      const found = (data.fields ?? []).find(
        (f: { perstag: string; id: string }) =>
          f.perstag?.toUpperCase() === 'EMPRESA',
      );
      empresaFieldId = found?.id ?? null;
    }
  } catch {
    /* ignore */
  }

  steps.push({
    step: '3_lookup_empresa_field',
    ok: !!empresaFieldId,
    responseSnippet: `empresaFieldId: ${empresaFieldId ?? 'null (perstag EMPRESA nao encontrado)'}`,
  });

  // Step 3b: ensure fieldRel (associate field to all lists via relid=0)
  // Sem isso o field nao aparece no contact view da UI do AC.
  if (empresaFieldId) {
    const t3b = Date.now();
    try {
      const res = await fetch(`${AC_URL}/api/3/fieldRels`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fieldRel: {
            field: empresaFieldId,
            relid: 0,
          },
        }),
      });
      const txt = await res.text();
      steps.push({
        step: '3b_ensure_fieldRel',
        ok: res.ok || res.status === 422, // 422 = ja existe
        httpStatus: res.status,
        responseSnippet: txt.substring(0, 400),
        durationMs: Date.now() - t3b,
      });
    } catch (err) {
      steps.push({
        step: '3b_ensure_fieldRel',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t3b,
      });
    }
  }

  // Step 4: POST /fieldValues com o field empresa
  if (empresaFieldId) {
    const t4 = Date.now();
    try {
      const res = await fetch(`${AC_URL}/api/3/fieldValues`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fieldValue: {
            contact: contactId,
            field: empresaFieldId,
            value: 'TesteBoldfyEmpresaDebug',
          },
        }),
      });
      const txt = await res.text();
      steps.push({
        step: '4_set_field_value',
        ok: res.ok,
        httpStatus: res.status,
        responseSnippet: txt.substring(0, 500),
        durationMs: Date.now() - t4,
      });
    } catch (err) {
      steps.push({
        step: '4_set_field_value',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t4,
      });
    }
  }

  // Step 5: verificar que o valor chegou — GET /contacts/:id/fieldValues
  const t5 = Date.now();
  try {
    const res = await fetch(`${AC_URL}/api/3/contacts/${contactId}/fieldValues`, {
      headers,
    });
    const txt = await res.text();
    let fieldValues = null;
    try {
      const parsed = JSON.parse(txt);
      fieldValues = (parsed.fieldValues ?? []).map(
        (fv: { field: string; value: string }) => ({
          field: fv.field,
          value: fv.value,
        }),
      );
    } catch {
      /* ignore */
    }
    steps.push({
      step: '5_verify_field_value',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: JSON.stringify(fieldValues),
      durationMs: Date.now() - t5,
    });
  } catch (err) {
    steps.push({
      step: '5_verify_field_value',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t5,
    });
  }

  const allOk = steps.every((s) => s.ok);
  const firstFail = steps.find((s) => !s.ok);

  return NextResponse.json({
    testEmail,
    contactId,
    empresaFieldId,
    steps,
    conclusion: allOk ? 'all_ok' : `failed_at_${firstFail?.step ?? 'unknown'}`,
  });
}
