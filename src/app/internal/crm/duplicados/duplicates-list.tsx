'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { mergePeople, mergeCompanies } from '@/app/internal/crm/actions';
import type { DuplicateCompanyPair, DuplicatePersonPair } from './page';

const IGNORE_KEY = 'crm_dup_ignored_v1';

function pairKey(aId: string, bId: string): string {
  return [aId, bId].sort().join('::');
}

function loadIgnored(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(IGNORE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveIgnored(set: Set<string>): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(IGNORE_KEY, JSON.stringify(Array.from(set)));
}

export function DuplicatesList({
  companyPairs,
  personPairs,
}: {
  companyPairs: DuplicateCompanyPair[];
  personPairs: DuplicatePersonPair[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<'companies' | 'people'>('companies');
  const [busy, setBusy] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [ignored, setIgnored] = useState<Set<string>>(new Set());

  // Hydrate ignored set após mount
  useEffect(() => {
    setIgnored(loadIgnored());
  }, []);

  const visibleCompany = companyPairs.filter((p) => !ignored.has(pairKey(p.a.id, p.b.id)));
  const visiblePerson = personPairs.filter((p) => !ignored.has(pairKey(p.a.id, p.b.id)));

  function ignore(aId: string, bId: string) {
    const k = pairKey(aId, bId);
    const next = new Set(ignored);
    next.add(k);
    setIgnored(next);
    saveIgnored(next);
  }

  function handleMergeCompanies(keepId: string, otherId: string) {
    const ok = confirm(
      `Mesclar as 2 empresas? A da esquerda fica (com dados das duas) e a da direita some. Activities e pessoas vão pra principal.`,
    );
    if (!ok) return;
    setBusy(pairKey(keepId, otherId));
    startTransition(async () => {
      const res = await mergeCompanies(keepId, [otherId]);
      setBusy(null);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      router.refresh();
    });
  }

  function handleMergePeople(keepId: string, otherId: string) {
    const ok = confirm(`Mesclar as 2 pessoas? A da esquerda fica e a da direita é arquivada.`);
    if (!ok) return;
    setBusy(pairKey(keepId, otherId));
    startTransition(async () => {
      const res = await mergePeople(keepId, [otherId]);
      setBusy(null);
      if (!res.ok) {
        alert(`Erro: ${res.error}`);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 18 }}>
        <TabButton active={tab === 'companies'} onClick={() => setTab('companies')}>
          Empresas <span style={{ marginLeft: 6, padding: '1px 8px', background: '#F1E6FA', borderRadius: 10, fontSize: 11 }}>{visibleCompany.length}</span>
        </TabButton>
        <TabButton active={tab === 'people'} onClick={() => setTab('people')}>
          Pessoas <span style={{ marginLeft: 6, padding: '1px 8px', background: '#F1E6FA', borderRadius: 10, fontSize: 11 }}>{visiblePerson.length}</span>
        </TabButton>
      </div>

      {tab === 'companies' ? (
        visibleCompany.length === 0 ? (
          <EmptyState>Nenhum par suspeito de empresa. Tudo limpo por aqui.</EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {visibleCompany.map((pair) => {
              const k = pairKey(pair.a.id, pair.b.id);
              return (
                <PairCard key={k} reason={pair.reason} busy={busy === k}>
                  <Side
                    title={pair.a.name}
                    href={`/internal/crm/companies/${pair.a.id}`}
                    lines={[
                      pair.a.industry,
                      pair.a.size,
                      pair.a.linkedinUrl ? '🔗 com LinkedIn' : '— sem LinkedIn',
                      `👥 ${pair.a.peopleCount} pessoa${pair.a.peopleCount === 1 ? '' : 's'}`,
                    ]}
                  />
                  <Actions
                    onMerge={() => handleMergeCompanies(pair.a.id, pair.b.id)}
                    onIgnore={() => ignore(pair.a.id, pair.b.id)}
                    swapHint
                    onMergeRight={() => handleMergeCompanies(pair.b.id, pair.a.id)}
                  />
                  <Side
                    title={pair.b.name}
                    href={`/internal/crm/companies/${pair.b.id}`}
                    lines={[
                      pair.b.industry,
                      pair.b.size,
                      pair.b.linkedinUrl ? '🔗 com LinkedIn' : '— sem LinkedIn',
                      `👥 ${pair.b.peopleCount} pessoa${pair.b.peopleCount === 1 ? '' : 's'}`,
                    ]}
                  />
                </PairCard>
              );
            })}
          </div>
        )
      ) : null}

      {tab === 'people' ? (
        visiblePerson.length === 0 ? (
          <EmptyState>Nenhum par suspeito de pessoa.</EmptyState>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {visiblePerson.map((pair) => {
              const k = pairKey(pair.a.id, pair.b.id);
              return (
                <PairCard key={k} reason={pair.reason} busy={busy === k}>
                  <Side
                    title={pair.a.name}
                    href={`/internal/crm/people/${pair.a.id}`}
                    lines={[pair.a.jobTitle, pair.a.companyName, pair.a.email ?? '— sem email']}
                  />
                  <Actions
                    onMerge={() => handleMergePeople(pair.a.id, pair.b.id)}
                    onIgnore={() => ignore(pair.a.id, pair.b.id)}
                    swapHint
                    onMergeRight={() => handleMergePeople(pair.b.id, pair.a.id)}
                  />
                  <Side
                    title={pair.b.name}
                    href={`/internal/crm/people/${pair.b.id}`}
                    lines={[pair.b.jobTitle, pair.b.companyName, pair.b.email ?? '— sem email']}
                  />
                </PairCard>
              );
            })}
          </div>
        )
      ) : null}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="crm-btn"
      style={{
        background: active ? '#F1E6FA' : 'transparent',
        color: active ? '#5E2A67' : '#9D85B3',
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: 28, background: '#FAF7FF', borderRadius: 12, textAlign: 'center', color: '#9D85B3', fontSize: 13 }}>
      {children}
    </div>
  );
}

function PairCard({ reason, busy, children }: { reason: string; busy: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      padding: 16,
      background: 'white',
      borderRadius: 12,
      border: '1px solid #E4D8ED',
      opacity: busy ? 0.5 : 1,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ fontSize: 11, color: '#9D85B3', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        💡 {reason}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 14, alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function Side({ title, href, lines }: { title: string; href: string; lines: Array<string | null | undefined> }) {
  return (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: '#5E2A67', marginBottom: 6 }}>{title}</div>
      {lines.filter((l) => l).map((l, i) => (
        <div key={i} style={{ fontSize: 11, color: '#6B5B8A', lineHeight: 1.6 }}>{l}</div>
      ))}
    </Link>
  );
}

function Actions({ onMerge, onIgnore, swapHint, onMergeRight }: { onMerge: () => void; onIgnore: () => void; swapHint?: boolean; onMergeRight?: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', minWidth: 140 }}>
      <button onClick={onMerge} className="crm-btn crm-btn-primary" style={{ fontSize: 12, padding: '6px 12px' }}>
        ← Mesclar na ←
      </button>
      {swapHint && onMergeRight ? (
        <button onClick={onMergeRight} className="crm-btn" style={{ fontSize: 12, padding: '6px 12px' }}>
          → Mesclar na →
        </button>
      ) : null}
      <button
        onClick={onIgnore}
        className="crm-btn"
        style={{ fontSize: 11, padding: '4px 10px', color: '#9D85B3' }}
      >
        ✕ Não são duplicatas
      </button>
    </div>
  );
}
