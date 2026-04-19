import { NextRequest, NextResponse } from 'next/server';

/**
 * TEMPORÁRIO — endpoint de diagnóstico da integração ActiveCampaign.
 *
 * Remover após validar a integração em produção.
 *
 * GET /api/debug-ac?key=<DEBUG_SECRET>
 *
 * Testa em ordem:
 * 1. Presença das env vars
 * 2. Ping GET /users/me (auth + conectividade)
 * 3. POST /contact/sync com email de teste (conforme faz o proposal-leads.ts)
 * 4. POST /tags (criar tag)
 * 5. POST /contactTags (linkar tag ao contato)
 * 6. POST /notes (anexar nota)
 *
 * Retorna JSON com cada etapa e seu resultado — diagnóstico completo do fluxo.
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

/**
 * Guard: o endpoint só responde se:
 *   1. DEBUG_SECRET estiver presente e `?key=...` bater, OU
 *   2. `?key=...` for exatamente o token derivado do hash da chave do AC
 *      (assim não precisamos rotacionar DEBUG_SECRET — qualquer pessoa
 *      sem acesso ao AC key não consegue gerar esse token).
 *
 * Como o atacante precisaria da key do AC pra gerar o token, o endpoint
 * fica protegido pelo próprio segredo que já existe no Vercel.
 */
async function isAuthorized(key: string | null): Promise<boolean> {
  if (!key) return false;

  // Opção 1: DEBUG_SECRET match
  if (process.env.DEBUG_SECRET && key === process.env.DEBUG_SECRET) return true;

  // Opção 2: token derivado da key do AC (últimos 12 chars do SHA-256)
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
  const authorized = await isAuthorized(secret);

  if (!authorized) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const AC_URL = process.env.ACTIVECAMPAIGN_API_URL;
  const AC_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
  const steps: StepResult[] = [];

  // Step 1: env vars presence
  steps.push({
    step: '1_env_vars',
    ok: !!AC_URL && !!AC_KEY,
    responseSnippet: JSON.stringify({
      AC_URL_set: !!AC_URL,
      AC_URL_preview: AC_URL ? AC_URL.substring(0, 40) + '...' : null,
      AC_KEY_set: !!AC_KEY,
      AC_KEY_length: AC_KEY ? AC_KEY.length : 0,
      AC_KEY_preview: AC_KEY ? AC_KEY.substring(0, 8) + '...' + AC_KEY.substring(AC_KEY.length - 4) : null,
    }),
  });

  if (!AC_URL || !AC_KEY) {
    return NextResponse.json({ steps, conclusion: 'env_vars_missing' });
  }

  const headers = {
    'Api-Token': AC_KEY,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  // Step 2: ping /users/me
  const t2 = Date.now();
  try {
    const res = await fetch(`${AC_URL}/api/3/users/me`, { headers });
    const txt = await res.text();
    steps.push({
      step: '2_ping_users_me',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: txt.substring(0, 500),
      durationMs: Date.now() - t2,
    });
  } catch (err) {
    steps.push({
      step: '2_ping_users_me',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t2,
    });
  }

  // Step 3: contact/sync
  const testEmail = `diag-${Date.now()}@boldfy-debug.dev`;
  const t3 = Date.now();
  let contactId: string | null = null;
  try {
    const res = await fetch(`${AC_URL}/api/3/contact/sync`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contact: {
          email: testEmail,
          firstName: 'Diagnostic',
          lastName: 'Test',
          phone: '',
        },
      }),
    });
    const txt = await res.text();
    // Tenta extrair ID
    try {
      const parsed = JSON.parse(txt);
      contactId = parsed.contact?.id ?? null;
    } catch {
      /* ignore */
    }
    steps.push({
      step: '3_contact_sync',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: txt.substring(0, 500) + ` | extractedId: ${contactId ?? 'null'}`,
      durationMs: Date.now() - t3,
    });
  } catch (err) {
    steps.push({
      step: '3_contact_sync',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t3,
    });
  }

  // Step 4: create tag (find or create)
  const tagName = `DEBUG-${Date.now()}`;
  const t4 = Date.now();
  let tagId: string | null = null;
  try {
    const res = await fetch(`${AC_URL}/api/3/tags`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tag: {
          tag: tagName,
          tagType: 'contact',
          description: 'Debug diagnostic tag',
        },
      }),
    });
    const txt = await res.text();
    try {
      const parsed = JSON.parse(txt);
      tagId = parsed.tag?.id ?? null;
    } catch {
      /* ignore */
    }
    steps.push({
      step: '4_create_tag',
      ok: res.ok,
      httpStatus: res.status,
      responseSnippet: txt.substring(0, 400) + ` | tagId: ${tagId ?? 'null'}`,
      durationMs: Date.now() - t4,
    });
  } catch (err) {
    steps.push({
      step: '4_create_tag',
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - t4,
    });
  }

  // Step 5: link tag to contact
  if (contactId && tagId) {
    const t5 = Date.now();
    try {
      const res = await fetch(`${AC_URL}/api/3/contactTags`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contactTag: {
            contact: contactId,
            tag: tagId,
          },
        }),
      });
      const txt = await res.text();
      steps.push({
        step: '5_link_tag_contact',
        ok: res.ok,
        httpStatus: res.status,
        responseSnippet: txt.substring(0, 400),
        durationMs: Date.now() - t5,
      });
    } catch (err) {
      steps.push({
        step: '5_link_tag_contact',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t5,
      });
    }
  }

  // Step 6: add note
  if (contactId) {
    const t6 = Date.now();
    try {
      const res = await fetch(`${AC_URL}/api/3/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          note: {
            note: 'Diagnostic note — criado pelo endpoint /api/debug-ac',
            relid: contactId,
            reltype: 'Subscriber',
          },
        }),
      });
      const txt = await res.text();
      steps.push({
        step: '6_add_note',
        ok: res.ok,
        httpStatus: res.status,
        responseSnippet: txt.substring(0, 400),
        durationMs: Date.now() - t6,
      });
    } catch (err) {
      steps.push({
        step: '6_add_note',
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - t6,
      });
    }
  }

  // Conclusão
  const allOk = steps.every((s) => s.ok);
  const firstFail = steps.find((s) => !s.ok);
  const conclusion = allOk
    ? 'all_steps_ok_integration_works'
    : `failed_at_${firstFail?.step ?? 'unknown'}`;

  return NextResponse.json({
    testEmail,
    contactId,
    tagId,
    steps,
    conclusion,
  });
}
