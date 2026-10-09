import { NextResponse } from 'next/server';
import { FreshnessSyncService } from '@/lib/services/sync';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Proteksi sederhana untuk cron di production jika env var terkonfigurasi
  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const report = FreshnessSyncService.runFullCatalogAudit();

  return NextResponse.json({
    status: 'success',
    message: 'Audit sinkronisasi katalog dan ketersediaan streaming berhasil dieksekusi',
    data: report,
  });
}
