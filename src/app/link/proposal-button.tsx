'use client';

import { useProposalBuilder } from '@/components/proposal-builder';

export function ProposalLinkButton() {
  const { openBuilder } = useProposalBuilder();
  return (
    <button
      type="button"
      onClick={() => openBuilder('link:solucoes')}
      className="group flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-primary px-[22px] py-[15px] text-[14.5px] font-bold text-white shadow-[0_8px_24px_rgba(205,80,241,0.28)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#d966f5]"
    >
      Montar sua proposta personalizada
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-1"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  );
}
