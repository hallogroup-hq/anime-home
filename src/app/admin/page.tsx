'use client';

import { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/services/store';
import { 
  Activity, AlertTriangle, CheckCircle2, ShieldAlert, 
  Layers, Film, DollarSign, Flag, RefreshCw 
} from 'lucide-react';

export default function AdminActionCenterPage() {
  const [metrics, setMetrics] = useState(db.getActionCenterMetrics());
  const [reports, setReports] = useState(db.getReports());

  const handleResolveReport = (reportId: string, status: 'resolved' | 'dismissed') => {
    db.resolveReport(reportId, status);
    setReports(db.getReports());
    setMetrics(db.getActionCenterMetrics());
  };

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* 1. EMERGENCY MOBILE TRIAGE BAR (PRD 10.3 — TOP 5 ACTIONS) */}
      <div className="rounded-3xl border-2 border-amber-500/40 bg-amber-950/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-amber-300">
              Emergency Action Center (Aksi Tanggap Darurat Cepat)
            </h2>
            <p className="text-xs text-slate-400">
              Tindakan berisiko tinggi tersedia langsung tanpa coding atau akses SQL langsung.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/rights"
            className="rounded-xl bg-red-950 border border-red-500/50 px-3.5 py-2 text-xs font-bold text-red-300 hover:bg-red-900 transition-colors"
          >
            Takedown Server Pelanggaran
          </Link>
          <Link
            href="/admin/ads"
            className="rounded-xl bg-surface-800 border border-border-700 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-surface-700 transition-colors"
          >
            Emergency Pause Iklan
          </Link>
        </div>
      </div>

      {/* 2. REAL METRIC TILES */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Total Anime</span>
          <span className="text-2xl font-black text-white mt-1">{metrics.totalAnime}</span>
          <span className="text-[10px] text-emerald-400 mt-1">Katalog Terbit</span>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Total Episode</span>
          <span className="text-2xl font-black text-white mt-1">{metrics.totalEpisodes}</span>
          <span className="text-[10px] text-slate-400 mt-1">Episode Shells</span>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Server Aktif</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{metrics.activeVariants}</span>
          <span className="text-[10px] text-emerald-400/80 mt-1">Multi-Provider</span>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Server Takedown</span>
          <span className="text-2xl font-black text-rose-400 mt-1">{metrics.takedownVariants}</span>
          <span className="text-[10px] text-rose-400/80 mt-1">Emergency Inactive</span>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Laporan Terbuka</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingReports}</span>
          <span className="text-[10px] text-amber-400/80 mt-1">Perlu Tinjauan</span>
        </div>

        <div className="rounded-2xl bg-surface-900 border border-border-800 p-4 flex flex-col">
          <span className="text-xs text-slate-400 font-semibold">Kampanye Iklan</span>
          <span className="text-2xl font-black text-cyan-400 mt-1">{metrics.activeCampaigns}</span>
          <span className="text-[10px] text-cyan-400/80 mt-1">Sponsor Resmi</span>
        </div>
      </div>

      {/* 3. PENDING REPORTS QUEUE (PRD ADM-HEALTH & J08) */}
      <section className="flex flex-col gap-4 rounded-3xl bg-surface-900 border border-border-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-400" />
            <h3 className="text-base font-extrabold text-white">
              Antrean Laporan Pemutar Rusak ({reports.filter(r => r.status === 'pending').length} Belum Selesai)
            </h3>
          </div>
          <span className="text-xs text-slate-400">Diperbarui realtime</span>
        </div>

        {reports.length > 0 ? (
          <div className="flex flex-col gap-2.5">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-ink-950 border border-border-700"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase">{rep.reason.replace('_', ' ')}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      rep.status === 'pending' ? 'bg-amber-950 text-amber-400 border border-amber-800' : 'bg-emerald-950 text-emerald-400'
                    }`}>
                      {rep.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Catatan: &quot;{rep.notes || 'Tidak ada catatan tambahan'}&quot;
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Varian ID: {rep.variantId} • {new Date(rep.reportedAt).toLocaleString('id-ID')}
                  </span>
                </div>

                {rep.status === 'pending' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleResolveReport(rep.id, 'resolved')}
                      className="rounded-xl bg-emerald-950 border border-emerald-600/50 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900"
                    >
                      Tandai Beres
                    </button>
                    <button
                      onClick={() => handleResolveReport(rep.id, 'dismissed')}
                      className="rounded-xl bg-surface-800 border border-border-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white"
                    >
                      Abaikan
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-xs text-slate-500">
            Tidak ada laporan stream rusak saat ini. Semua server beroperasi normal.
          </div>
        )}
      </section>
    </div>
  );
}
