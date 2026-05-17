'use server';

import { revalidatePath } from 'next/cache';
import { createCampaign, deleteCampaign, type CreateCampaignInput } from '@/lib/campaigns';

export async function createCampaignAction(input: CreateCampaignInput) {
  const result = await createCampaign(input);
  if (result.ok) {
    revalidatePath('/internal/dashboard/campanhas');
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
