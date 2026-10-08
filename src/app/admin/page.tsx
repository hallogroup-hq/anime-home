'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { resolveReportAction } from '@/lib/actions';

export default function AdminActionCenterPage() {
  const [metrics, setMetrics] = useState(db.getActionCenterMetrics());
  const [reports, setReports] = useState(db.getReports());

  const handleResolveReport = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await resolveReportAction(reportId, status);
      db.resolveReport(reportId, status);
      setReports(db.getReports());
      setMetrics(db.getActionCenterMetrics());
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status laporan');
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* 1. COMPACT METRICS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col">
          <span className="text-xs text-zinc-400">Total Judul</span>
          <span className="text-2xl font-bold text-white mt-1">{metrics.totalAnime}</span>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col">
          <span className="text-xs text-zinc-400">Server Aktif</span>
          <span className="text-2xl font-bold text-white mt-1">{metrics.activeVariants}</span>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col">
          <span className="text-xs text-zinc-400">Laporan Video Masuk</span>
          <span className={`text-2xl font-bold mt-1 ${metrics.pendingReports > 0 ? 'text-amber-400' : 'text-white'}`}>
            {metrics.pendingReports}
          </span>
        </div>

        <div className="rounded-xl bg-zinc-900 border border-white/[0.08] p-4 flex flex-col">
          <span className="text-xs text-zinc-400">Iklan Aktif</span>
          <span className="text-2xl font-bold text-white mt-1">{metrics.activeCampaigns}</span>
        </div>
      </div>

      {/* 2. LAPORAN DARI PENGGUNA */}
      <section className="flex flex-col gap-3 rounded-2xl bg-zinc-900 border border-white/[0.08] p-5">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold text-white">
            Laporan Pemutar Video ({reports.filter(r => r.status === 'pending').length} Belum Ditangani)
          </h2>
          <span className="text-xs text-zinc-500">Live Queue</span>
        </div>

        {reports.length > 0 ? (
          <div className="flex flex-col divide-y divide-white/[0.06]">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">
                      {rep.reason === 'broken_embed' ? 'Video Tidak Berjalan' : rep.reason}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      rep.status === 'pending' ? 'bg-amber-950 text-amber-300' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  {rep.notes && (
                    <p className="text-zinc-400">&quot;{rep.notes}&quot;</p>
                  )}
                  <span className="text-[10px] text-zinc-500">
                    ID Varian: {rep.variantId} • {new Date(rep.reportedAt).toLocaleString('id-ID')}
                  </span>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-emerald-400"
                    >
                      Selesai
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs text-zinc-400"
                    >
                      Abaikan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-zinc-500">
            Tidak ada laporan tertunda.
          </div>
        )}
      </section>

      {/* 3. TAUTAN PINTAS OPERASI CEPAT */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/matrix"
          className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors"
        >
          Buka Matriks Server Episode
        </Link>
        <Link
          href="/admin/rights"
          className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors"
        >
          Kelola Takedown Hak Cipta
        </Link>
        <Link
          href="/admin/ads"
          className="rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-white/[0.08] px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors"
        >
          Kelola Iklan & Sponsor
        </Link>
      </div>
    </div>
  );
}
