'use server';

import { revalidatePath } from 'next/cache';
import { ReportRepository } from '@/lib/server/repositories';
import { requireRole } from './authActions';
import { BrokenStreamReport } from '@/types';

export async function reportBrokenStreamAction(params: {
  variantId: string;
  episodeId: string;
  reason: BrokenStreamReport['reason'];
  notes?: string;
}) {
  const report = await ReportRepository.createReport(params);
  revalidatePath('/admin/monitoring');
  revalidatePath(`/watch/${params.episodeId}`);
  return { success: true, report };
}

export async function resolveReportAction(id: string, status: 'resolved' | 'dismissed') {
  await requireRole(['owner', 'admin', 'operator', 'moderator']);

  const ok = await ReportRepository.resolveReport(id, status);
  revalidatePath('/admin/monitoring');
  return { success: ok };
}
