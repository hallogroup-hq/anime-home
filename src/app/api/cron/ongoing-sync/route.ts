import { NextResponse } from 'next/server';
import { OngoingSyncService } from '@/lib/services/ongoingSyncService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  const expectedSecret = process.env.CRON_SECRET;
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dryRun = searchParams.get('dryRun') === 'true';
  const report = await OngoingSyncService.syncOngoingAnime({ dryRun });

  return NextResponse.json({
    status: report.status,
    data: report,
  });
}

export async function POST(request: Request) {
  return GET(request);
}
