'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CampaignFormModal } from './campaign-form';

export function NewCampaignButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="crm-btn crm-btn-primary"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        onClick={() => setOpen(true)}
      >
        <Plus size={14} /> Nova campanha
      </button>
      <CampaignFormModal mode={{ kind: 'create' }} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
