'use server';

import { revalidatePath } from 'next/cache';
import { createCampaign, updateCampaign, deleteCampaign, type CampaignInput } from '@/lib/campaigns';

export async function createCampaignAction(input: CampaignInput) {
  const result = await createCampaign(input);
  if (result.ok) {
    revalidatePath('/internal/dashboard/campanhas');
  }
  return result;
}

export async function updateCampaignAction(id: string, input: CampaignInput) {
  const result = await updateCampaign(id, input);
  if (result.ok) {
    revalidatePath('/internal/dashboard/campanhas');
    revalidatePath(`/internal/dashboard/campanhas/[slug]`, 'page');
  }
  return result;
}

export async function deleteCampaignAction(id: string) {
  const result = await deleteCampaign(id);
  if (result.ok) {
    revalidatePath('/internal/dashboard/campanhas');
  }
  return result;
}
