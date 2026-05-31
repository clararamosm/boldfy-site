'use server';
import { importLeads, type ImportLeadsInput } from '@/lib/import-leads';
import { revalidatePath } from 'next/cache';

export async function runImport(input: ImportLeadsInput) {
  const result = await importLeads(input);
  if (result.ok) {
    revalidatePath('/internal/crm/forms');
    revalidatePath('/internal/crm');
  }
  return result;
}
