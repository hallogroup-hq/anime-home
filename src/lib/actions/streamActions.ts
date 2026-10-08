'use server';

import { revalidatePath } from 'next/cache';
import { StreamRepository, ProviderRepository } from '@/lib/server/repositories';
import { requireRole } from './authActions';
import { StreamVariant, Provider } from '@/types';

export async function addStreamVariantAction(data: Partial<StreamVariant>) {
  await requireRole(['owner', 'admin', 'operator']);

  // Validate domain allowlist
  if (data.embedUrl) {
    const isAllowed = await ProviderRepository.isDomainAllowed(data.embedUrl);
    if (!isAllowed) {
      throw new Error('SECURITY_ERROR: Domain embed URL belum terdaftar atau tidak diizinkan di whitelist provider');
    }
  }

  const variant = await StreamRepository.addStreamVariant(data);
  revalidatePath(`/watch/${data.episodeId}`);
  revalidatePath('/admin/matrix');
  revalidatePath('/admin/monitoring');
  return { success: true, variant };
}

export async function updateVariantAction(id: string, updates: Partial<StreamVariant>) {
  await requireRole(['owner', 'admin', 'operator']);

  const variant = await StreamRepository.updateVariant(id, updates);
  if (!variant) return { success: false, error: 'Variant tidak ditemukan' };

  revalidatePath(`/watch/${variant.episodeId}`);
  revalidatePath('/admin/matrix');
  revalidatePath('/admin/monitoring');
  return { success: true, variant };
}

export async function emergencyTakedownAction(variantId: string, reason: string) {
  // Emergency takedown: Owner, Admin, or Streaming Operator
  await requireRole(['owner', 'admin', 'operator']);

  const ok = await StreamRepository.emergencyTakedown(variantId, reason);
  if (!ok) return { success: false, error: 'Gagal melakukan takedown' };

  const variant = await StreamRepository.getVariantById(variantId);
  if (variant) {
    revalidatePath(`/watch/${variant.episodeId}`);
  }
  revalidatePath('/admin/matrix');
  revalidatePath('/admin/rights');
  revalidatePath('/admin/monitoring');
  return { success: true };
}

export async function restoreVariantAction(variantId: string) {
  await requireRole(['owner', 'admin', 'operator']);

  const ok = await StreamRepository.restoreVariant(variantId);
  if (!ok) return { success: false, error: 'Gagal memulihkan varian stream' };

  const variant = await StreamRepository.getVariantById(variantId);
  if (variant) {
    revalidatePath(`/watch/${variant.episodeId}`);
  }
  revalidatePath('/admin/matrix');
  revalidatePath('/admin/monitoring');
  return { success: true };
}

export async function toggleProviderStatusAction(providerId: string, status: 'active' | 'paused' | 'blocked') {
  await requireRole(['owner', 'admin', 'operator']);

  const prov = await ProviderRepository.updateProviderStatus(providerId, status);
  if (!prov) return { success: false, error: 'Provider tidak ditemukan' };

  revalidatePath('/admin/providers');
  revalidatePath('/admin/matrix');
  revalidatePath('/watch/[episodeId]', 'page');
  return { success: true, provider: prov };
}

export async function registerProviderAction(data: Partial<Provider>) {
  await requireRole(['owner', 'admin', 'operator']);

  const prov = await ProviderRepository.registerProvider(data);
  revalidatePath('/admin/providers');
  return { success: true, provider: prov };
}
