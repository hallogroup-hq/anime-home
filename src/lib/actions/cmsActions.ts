'use server';

import { revalidatePath } from 'next/cache';
import { CmsRepository } from '@/lib/server/repositories';
import { requireRole } from './authActions';
import { HomepageConfig } from '@/types';

export async function getHomepageConfigAction() {
  return CmsRepository.getHomepageConfig();
}

export async function updateHomepageConfigAction(config: HomepageConfig) {
  await requireRole(['owner', 'admin', 'editor']);

  const updated = await CmsRepository.updateHomepageConfig(config);
  revalidatePath('/');
  revalidatePath('/admin/homepage');
  return { success: true, config: updated };
}
