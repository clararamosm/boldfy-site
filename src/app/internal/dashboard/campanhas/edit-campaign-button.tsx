'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import type { Campaign } from '@/lib/campaigns';
import { CampaignFormModal } from './campaign-form';

export function EditCampaignButton({ campaign }: { campaign: Campaign }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="campaign-edit-btn"
        aria-label={`Editar ${campaign.name}`}
        title="Editar campanha"
      >
        <Pencil size={14} />
      </button>
      <CampaignFormModal mode={{ kind: 'edit', campaign }} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
