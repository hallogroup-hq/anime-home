import type { Metadata } from 'next';
import { ReceiptClient } from '@/components/topup/ReceiptClient';

export const metadata: Metadata = { title: 'Status Pesanan Top Up', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function TopupOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReceiptClient id={id} />;
}
