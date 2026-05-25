#!/usr/bin/env python3
"""
Cleanup das tags do AC (mai/2026, refactor CRM source-of-truth).

Migra contatos de tags legadas pras novas, depois deleta as legadas.

Pares de migração:
  Segmento: Líderes B2B (32)        → Líder B2B
  Segmento: Parceiros estratégicos  → Parceiro estratégico
  Segmento: Profissionais Individuais → Profissional individual
  Segmento: Newsletter Boldfy       → Newsletter

Tags fantasmas pra deletar (depois de validar zero contatos):
  Status: * (5 tags), Origem: * (2), header:desktop, LP Algoritmo LinkedIn,
  Report: Algoritmo LinkedIn 2026, Pipeline: Quero prospectar, Cadência: ...,
  Segmento: Beta tester

Tags faltantes pra criar:
  Form: Beta Test, Form: Case Semrush ELG, Form: LinkedIn, Unsubscribed

Uso:
  python3 scripts/ac-tag-cleanup.py --dry-run    # mostra o que faria
  python3 scripts/ac-tag-cleanup.py --apply       # executa de verdade
"""

import os
import sys
import time
import argparse
from urllib import request, parse, error
import json

API_URL = os.environ.get('ACTIVECAMPAIGN_API_URL', '').rstrip('/')
API_KEY = os.environ.get('ACTIVECAMPAIGN_API_KEY', '')

if not API_URL or not API_KEY:
    print('ERROR: ACTIVECAMPAIGN_API_URL / ACTIVECAMPAIGN_API_KEY ausente.')
    sys.exit(1)


def ac_request(method: str, path: str, body=None):
    url = f"{API_URL}/api/3/{path.lstrip('/')}"
    data = json.dumps(body).encode() if body else None
    req = request.Request(url, data=data, method=method, headers={
        'Api-Token': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    })
    try:
        with request.urlopen(req, timeout=30) as resp:
            txt = resp.read().decode()
            return json.loads(txt) if txt else {}
    except error.HTTPError as e:
        body_text = e.read().decode() if e.fp else ''
        print(f"  HTTP {e.code} on {method} {path}: {body_text[:200]}")
        return None


def list_tags():
    """Retorna dict {tag_name: {id, count}}."""
    out = {}
    r = ac_request('GET', 'tags?limit=100')
    for t in r.get('tags', []):
        out[t['tag']] = {'id': t['id'], 'count': int(t.get('subscriber_count') or 0)}
    return out


def list_contacts_with_tag(tag_id: int):
    """Retorna list of {contact_id, ct_id} pra todos com a tag.

    Usa /api/3/contacts?tagid=X&include=contactTags — o endpoint contactTags
    direto NAO suporta filtro por tag, apesar do que a doc sugere.
    """
    out = []
    offset = 0
    limit = 100
    while True:
        r = ac_request('GET', f'contacts?tagid={tag_id}&include=contactTags&limit={limit}&offset={offset}')
        if not r:
            break
        contacts = r.get('contacts', [])
        if not contacts:
            break
        # Mapeia ct_id por (contact_id, tag_id)
        ct_lookup = {}
        for ct in r.get('contactTags', []):
            if int(ct['tag']) == int(tag_id):
                ct_lookup[ct['contact']] = ct['id']
        for c in contacts:
            ct_id = ct_lookup.get(c['id'])
            if ct_id:
                out.append({'contact_id': c['id'], 'ct_id': ct_id})
        total = int(r.get('meta', {}).get('total', 0))
        if offset + limit >= total:
            break
        offset += limit
    return out


def add_tag_to_contact(contact_id: str, tag_id: int):
    return ac_request('POST', 'contactTags', {
        'contactTag': {'contact': contact_id, 'tag': tag_id}
    })


def remove_contact_tag(ct_id: str):
    return ac_request('DELETE', f'contactTags/{ct_id}')


def create_tag(name: str, desc: str = ''):
    return ac_request('POST', 'tags', {
        'tag': {'tag': name, 'tagType': 'contact', 'description': desc}
    })


def delete_tag(tag_id: int):
    return ac_request('DELETE', f'tags/{tag_id}')


# ---------- plano ----------

MIGRATIONS = [
    ('Segmento: Líderes B2B',                  'Líder B2B'),
    ('Segmento: Parceiros estratégicos',       'Parceiro estratégico'),
    ('Segmento: Profissionais Individuais',    'Profissional individual'),
    ('Segmento: Newsletter Boldfy',            'Newsletter'),
]

GHOSTS_TO_DELETE = [
    'Cadência: Report Algoritmo concluída',
    'header:desktop',
    'LP Algoritmo LinkedIn',
    'Origem: LP Algoritmo LinkedIn',
    'Origem: header:desktop',
    'Pipeline: Quero prospectar',
    'Report: Algoritmo LinkedIn 2026',
    'Segmento: Beta tester',
    'Status: Demo agendada',
    'Status: Em andamento',
    'Status: Fechado',
    'Status: Lead',
    'Status: Reunião marcada',
]

TAGS_TO_CREATE = [
    ('Form: Beta Test',         'Tag-mae da cadencia de Beta Test (aplicada pelo site quando lead preenche /beta-test).'),
    ('Form: Case Semrush ELG',  'Tag-mae da cadencia do Case Semrush ELG (aplicada pelo site quando lead preenche /case-semrush).'),
    ('Form: LinkedIn',          'Tag-mae da captura via extensao LinkedIn (futura).'),
    ('Unsubscribed',            'Lead deu unsubscribe global no AC. Espelhado para CRM Boldfy via webhook.'),
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--apply', action='store_true', help='executa de verdade')
    args = ap.parse_args()
    DRY = not args.apply

    print(f"\n{'='*60}")
    print(f"MODO: {'APPLY (vai modificar AC!)' if not DRY else 'DRY-RUN (so simula)'}")
    print(f"{'='*60}\n")

    tags = list_tags()
    print(f"Tags atuais no AC: {len(tags)}\n")

    # ---- C.1 — Migrar segmentos legados ----
    print("--- C.1: MIGRAÇÃO DE SEGMENTOS ---")
    for old_name, new_name in MIGRATIONS:
        old = tags.get(old_name)
        new = tags.get(new_name)
        if not old:
            print(f"  ⏭  '{old_name}' não existe — pulando.")
            continue
        if not new:
            print(f"  ❌ destino '{new_name}' não existe — pulando.")
            continue
        print(f"\n  '{old_name}' (id={old['id']}, {old['count']} contatos) → '{new_name}' (id={new['id']})")
        contacts = list_contacts_with_tag(old['id'])
        print(f"    Achei {len(contacts)} contatos com a tag antiga.")
        if DRY:
            continue
        # Paraleliza ate 10 requests simultaneos (AC aceita ~5 RPS por API key)
        from concurrent.futures import ThreadPoolExecutor
        def migrate_one(c):
            add_tag_to_contact(c['contact_id'], new['id'])
            remove_contact_tag(c['ct_id'])
        with ThreadPoolExecutor(max_workers=8) as ex:
            list(ex.map(migrate_one, contacts))
        print(f"    ✅ {len(contacts)} contatos processados (add+remove).")

    # ---- C.2 — Deletar tags fantasmas ----
    print("\n--- C.2: DELETAR TAGS FANTASMAS ---")
    # Re-fetch tags (counts mudaram)
    if not DRY:
        time.sleep(2)
        tags = list_tags()
    for name in GHOSTS_TO_DELETE + [m[0] for m in MIGRATIONS]:
        t = tags.get(name)
        if not t:
            print(f"  ⏭  '{name}' não existe — pulando.")
            continue
        if t['count'] > 0 and DRY:
            print(f"  ⚠️  '{name}' ainda tem {t['count']} contatos — vai mover/limpar antes de deletar.")
        if DRY:
            continue
        # Se ainda tem contatos (fantasma com leads), remove primeiro
        if t['count'] > 0:
            contacts = list_contacts_with_tag(t['id'])
            print(f"  '{name}' (id={t['id']}) tem {len(contacts)} contatos — removendo tag deles primeiro...")
            from concurrent.futures import ThreadPoolExecutor
            with ThreadPoolExecutor(max_workers=8) as ex:
                list(ex.map(lambda c: remove_contact_tag(c['ct_id']), contacts))
        r = delete_tag(t['id'])
        if r is not None:
            print(f"  🗑  '{name}' deletada.")

    # ---- C.3 — Criar tags faltantes ----
    print("\n--- C.3: CRIAR TAGS FALTANTES ---")
    for name, desc in TAGS_TO_CREATE:
        if name in tags:
            print(f"  ⏭  '{name}' já existe — pulando.")
            continue
        if DRY:
            print(f"  + Criaria '{name}' — {desc[:60]}...")
            continue
        r = create_tag(name, desc)
        if r:
            print(f"  ✅ '{name}' criada (id={r.get('tag',{}).get('id')}).")

    print("\nDone.")


if __name__ == '__main__':
    main()
