'use client';
import { useMemo, useState } from 'react';
import { runImport } from './actions';
import type { ImportLeadsInput, ImportTargetKey } from '@/lib/import-leads';

type Props = {
  campaigns: { slug: string; name: string }[];
};

const TARGET_FIELDS: { key: ImportTargetKey; label: string }[] = [
  { key: 'name', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Telefone' },
  { key: 'jobTitle', label: 'Cargo' },
  { key: 'companyName', label: 'Empresa' },
  { key: 'linkedinUrl', label: 'LinkedIn' },
];

const SEGMENT_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '— Sem segmento —' },
  { value: 'lider_b2b', label: 'Líder B2B' },
  { value: 'parceiro', label: 'Parceiro estratégico' },
  { value: 'profissional_individual', label: 'Profissional individual' },
];

const SYNONYMS: Record<ImportTargetKey, string[]> = {
  name: ['name', 'nome', 'fullname', 'nomecompleto', 'contato', 'contact'],
  email: ['email', 'e-mail', 'mail', 'correo', 'emailaddress'],
  phone: ['phone', 'telefone', 'tel', 'celular', 'whatsapp', 'fone', 'mobile'],
  jobTitle: ['cargo', 'title', 'jobtitle', 'position', 'funcao', 'role', 'cargotitulo'],
  companyName: ['empresa', 'company', 'organizacao', 'organization', 'account', 'companhia'],
  linkedinUrl: ['linkedin', 'linkedinurl', 'perfillinkedin', 'linkedinprofile'],
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',' || ch === ';' || ch === '\t') {
      cur.push(field);
      field = '';
    } else if (ch === '\n') {
      cur.push(field);
      rows.push(cur);
      cur = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field.length > 0 || cur.length > 0) {
    cur.push(field);
    rows.push(cur);
  }
  return rows.filter((r) => r.some((c) => c.trim().length > 0));
}

function autoMap(headers: string[]): Record<ImportTargetKey, number | null> {
  const normHeaders = headers.map(norm);
  const result = {} as Record<ImportTargetKey, number | null>;
  for (const { key } of TARGET_FIELDS) {
    let found: number | null = null;
    const syns = SYNONYMS[key];
    for (let i = 0; i < normHeaders.length; i++) {
      const h = normHeaders[i];
      if (syns.some((s) => h === s || h.includes(s))) {
        found = i;
        break;
      }
    }
    result[key] = found;
  }
  return result;
}

export function ImportClient({ campaigns }: Props) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<ImportTargetKey, number | null>>(
    {} as Record<ImportTargetKey, number | null>,
  );
  const [campaignSlug, setCampaignSlug] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [segment, setSegment] = useState('');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{ processed: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      const parsed = parseCsv(text);
      if (parsed.length === 0) {
        setError('CSV vazio ou inválido.');
        return;
      }
      const hdrs = parsed[0].map((h) => h.trim());
      setHeaders(hdrs);
      setRows(parsed.slice(1));
      setMapping(autoMap(hdrs));
    };
    reader.readAsText(file);
  }

  const nameMapped = mapping.name !== null && mapping.name !== undefined;
  const emailMapped = mapping.email !== null && mapping.email !== undefined;
  const canImport = rows.length > 0 && (nameMapped || emailMapped) && !pending;

  const previewRows = useMemo(() => rows.slice(0, 5), [rows]);

  async function handleImport() {
    setPending(true);
    setError(null);
    setResult(null);
    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const input: ImportLeadsInput = {
      mapping,
      rows,
      campaignSlug: campaignSlug || null,
      tags,
      segment: segment || null,
    };
    try {
      const res = await runImport(input);
      if (res.ok) {
        setResult({ processed: res.processed, skipped: res.skipped });
      } else {
        setError(res.error ?? 'Erro ao importar.');
      }
    } catch {
      setError('Erro ao importar.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div>
        <label className="block text-sm font-medium mb-1">Arquivo CSV</label>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} className="text-sm" />
        {fileName && (
          <p className="mt-1 text-xs text-gray-500">
            {fileName} · {rows.length} linha(s)
          </p>
        )}
      </div>

      {headers.length > 0 && (
        <>
          <div>
            <p className="text-sm font-medium mb-2">Mapeamento de colunas</p>
            <p className="text-xs text-gray-500 mb-3">
              As que casam pelo nome já vêm preenchidas. Ajuste o que faltar.
            </p>
            <div className="space-y-2">
              {TARGET_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-gray-700">{f.label}</span>
                  <select
                    value={mapping[f.key] ?? ''}
                    onChange={(e) =>
                      setMapping((m) => ({
                        ...m,
                        [f.key]: e.target.value === '' ? null : Number(e.target.value),
                      }))
                    }
                    className="rounded border px-2 py-1 text-sm"
                  >
                    <option value="">— Não importar —</option>
                    {headers.map((h, i) => (
                      <option key={i} value={i}>
                        {h || `Coluna ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {!nameMapped && !emailMapped && (
              <p className="mt-2 text-xs text-red-600">
                Mapeie pelo menos Nome ou Email pra conseguir importar.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Campanha</label>
              <select
                value={campaignSlug}
                onChange={(e) => setCampaignSlug(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
              >
                <option value="">— Nenhuma —</option>
                {campaigns.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">Aplica a tag de evento da campanha.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Segmento</label>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="w-full rounded border px-2 py-1 text-sm"
              >
                {SEGMENT_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (vírgula)</label>
              <input
                type="text"
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="ex: VIP, Indicação"
                className="w-full rounded border px-2 py-1 text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Prévia (5 primeiras)</p>
            <div className="overflow-x-auto rounded border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    {headers.map((h, i) => (
                      <th key={i} className="px-2 py-1">
                        {h || `Coluna ${i + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((r, ri) => (
                    <tr key={ri} className="border-b">
                      {headers.map((_, ci) => (
                        <td key={ci} className="px-2 py-1">
                          {r[ci] ?? ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={handleImport}
            disabled={!canImport}
            className="rounded bg-purple-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? 'Importando…' : `Importar ${rows.length} lead(s)`}
          </button>
        </>
      )}

      {result && (
        <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Importação concluída: {result.processed} inserido(s)/atualizado(s)
          {result.skipped > 0 ? `, ${result.skipped} ignorado(s) (sem nome nem email)` : ''}.
        </div>
      )}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
