'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { BrokenStreamReport, StreamVariant } from '@/types';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ShieldAlert, 
  Check, 
  X, 
  Radio, 
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { restoreVariantAction, resolveReportAction } from '@/lib/actions';

export default function AdminMonitoringPage() {
  const [reports, setReports] = useState<BrokenStreamReport[]>(() => db.getReports());
  const [variants, setVariants] = useState<StreamVariant[]>(() => db.getAllStreamVariants());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');
  const [notice, setNotice] = useState<string | null>(null);

  // Ping simulation state
  const [testUrl, setTestUrl] = useState('https://storage.googleapis.com/test-stream/master.m3u8');
  const [pingResult, setPingResult] = useState<{ allowed: boolean; reason?: string; latency?: number } | null>(null);
  const [variantPingResults, setVariantPingResults] = useState<Record<string, { status: string; latencyMs: number }>>({});

  const reloadData = () => {
    setReports(db.getReports());
    setVariants(db.getAllStreamVariants());
  };

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      await resolveReportAction(reportId, status);
      db.resolveReport(reportId, status);
      showNotification(`Laporan berhasil diubah menjadi: ${status === 'resolved' ? 'Selesai' : 'Diabaikan'} di PostgreSQL.`);
      reloadData();
    } catch (err: any) {
      showNotification(`Gagal: ${err.message}`);
    }
  };

  const handleRestoreVariant = async (variantId: string) => {
    try {
      await restoreVariantAction(variantId);
      db.restoreSource(variantId);
      showNotification(`Stream ${variantId} berhasil dipulihkan ke status aktif di PostgreSQL.`);
      reloadData();
    } catch (err: any) {
      showNotification(`Gagal: ${err.message}`);
    }
  };

  const handlePingVariant = (variantId: string) => {
    const res = db.pingStreamVariant(variantId);
    setVariantPingResults(prev => ({
      ...prev,
      [variantId]: { status: res.status, latencyMs: res.latencyMs },
    }));
    showNotification(`Hasil Ping: ${res.status.toUpperCase()} (${res.latencyMs}ms)`);
    reloadData();
  };

  const handleTestUrlAllowlist = () => {
    const res = db.validateEmbedUrl(testUrl);
    setPingResult({
      allowed: res.allowed,
      reason: res.reason,
      latency: res.allowed ? Math.floor(Math.random() * 50) + 40 : undefined,
    });
  };

  const handleSimulateThreshold = () => {
    // Pick the first approved variant and simulate 3 reports
    const target = variants.find(v => v.moderationState === 'approved');
    if (!target) return;

    db.reportBrokenStream({
      episodeId: target.episodeId,
      variantId: target.id,
      reason: 'broken_embed',
      notes: 'Simulasi pengujian otomatis - video hitam',
    });
    db.reportBrokenStream({
      episodeId: target.episodeId,
      variantId: target.id,
      reason: 'broken_embed',
      notes: 'Simulasi pengujian otomatis - audio hilang',
    });
    db.reportBrokenStream({
      episodeId: target.episodeId,
      variantId: target.id,
      reason: 'broken_embed',
      notes: 'Simulasi pengujian otomatis - 404 stream dead',
    });

    showNotification(`Simulasi 3 laporan berhasil dikirim ke ${target.providerName} (${target.qualityLabel})! Aturan Auto-Quarantine aktif.`);
    reloadData();
  };

  const quarantinedVariants = variants.filter(
    v => v.moderationState === 'paused' || v.verificationState === 'offline' || v.moderationState === 'takedown'
  );

  const activeCount = variants.filter(v => v.moderationState === 'approved').length;
  const healthRate = variants.length > 0 ? Math.round((activeCount / variants.length) * 100) : 100;
  const pendingCount = reports.filter(r => r.status === 'pending').length;

  const filteredReports = reports.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            <span>Health Monitoring & Auto-Quarantine</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Pemantauan ketersediaan stream, deteksi broken link, dan penegakan karantina otomatis jika threshold laporan tercapai.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={reloadData}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-zinc-900 px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Segarkan Data</span>
          </button>

          <button
            onClick={handleSimulateThreshold}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            title="Kirim 3 laporan sekaligus untuk menguji trigger Auto-Quarantine"
          >
            <Zap className="h-3.5 w-3.5" />
            <span>Tes Trigger Karantina (3 Laporan)</span>
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-4">
          <span className="text-[11px] font-medium text-zinc-400">Tingkat Kesehatan Stream</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-400">{healthRate}%</span>
            <span className="text-xs text-zinc-500">{activeCount} / {variants.length} aktif</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-4">
          <span className="text-[11px] font-medium text-zinc-400">Stream Dikarantina</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${quarantinedVariants.length > 0 ? 'text-amber-400' : 'text-zinc-200'}`}>
              {quarantinedVariants.length}
            </span>
            <span className="text-xs text-zinc-500">varian offline/paused</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-4">
          <span className="text-[11px] font-medium text-zinc-400">Laporan Pending</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${pendingCount > 0 ? 'text-red-400' : 'text-zinc-200'}`}>
              {pendingCount}
            </span>
            <span className="text-xs text-zinc-500">butuh verifikasi</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-4">
          <span className="text-[11px] font-medium text-zinc-400">Total Riwayat Laporan</span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-zinc-200">{reports.length}</span>
            <span className="text-xs text-zinc-500">tiket terdata</span>
          </div>
        </div>
      </div>

      {/* Section 1: Quarantined Streams Queue */}
      <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Antrean Karantina Otomatis (Auto-Quarantine Queue)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Stream yang otomatis disembunyikan dari publik karena mencapai ambang batas laporan (≥3) atau dipause oleh sistem.
            </p>
          </div>
          <span className="rounded-md bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-300">
            {quarantinedVariants.length} Dalam Karantina
          </span>
        </div>

        {quarantinedVariants.length === 0 ? (
          <div className="rounded-lg border border-white/[0.04] bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
            Semua stream beroperasi normal. Tidak ada varian stream yang sedang dikarantina.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-2.5 font-semibold">ID & Episode</th>
                  <th className="pb-2.5 font-semibold">Provider / Server</th>
                  <th className="pb-2.5 font-semibold">Kualitas</th>
                  <th className="pb-2.5 font-semibold">Status Moderasi</th>
                  <th className="pb-2.5 font-semibold">Laporan Terkait</th>
                  <th className="pb-2.5 font-semibold text-right">Aksi Operator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {quarantinedVariants.map((v) => {
                  const relatedReports = reports.filter(r => r.variantId === v.id && r.status === 'pending');
                  const ping = variantPingResults[v.id];

                  return (
                    <tr key={v.id} className="hover:bg-zinc-800/20">
                      <td className="py-3 font-mono text-[11px] text-zinc-300">
                        <div>{v.id}</div>
                        <div className="text-[10px] text-zinc-500">{v.episodeId}</div>
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-white">{v.providerName}</span>
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-zinc-800 px-2 py-0.5 font-mono text-[11px] text-zinc-300">
                          {v.qualityLabel}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400 uppercase">
                          {v.moderationState} / {v.verificationState}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="text-red-400 font-bold">
                          {relatedReports.length} laporan pending
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handlePingVariant(v.id)}
                            className="rounded-lg border border-white/[0.08] bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:text-white transition-colors cursor-pointer"
                          >
                            {ping ? `${ping.latencyMs}ms` : 'Ping'}
                          </button>
                          <button
                            onClick={() => handleRestoreVariant(v.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 transition-colors cursor-pointer"
                          >
                            Pulihkan ke Publik
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Live User Reports Triage */}
      <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>Tiket Laporan Pengguna (Broken Stream Triage)</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Laporan kerusakan player yang dikirim langsung oleh penonton di halaman streaming.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 rounded-lg bg-zinc-950 p-1 border border-white/[0.06] text-xs">
            {(['all', 'pending', 'resolved', 'dismissed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`rounded px-2.5 py-1 font-medium capitalize transition-colors cursor-pointer ${
                  filterStatus === st ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {st === 'all' ? 'Semua' : st}
              </button>
            ))}
          </div>
        </div>

        {filteredReports.length === 0 ? (
          <div className="rounded-lg border border-white/[0.04] bg-zinc-950/40 p-6 text-center text-xs text-zinc-500">
            Tidak ada laporan dalam status ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] text-zinc-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="pb-2.5 font-semibold">Waktu & ID</th>
                  <th className="pb-2.5 font-semibold">Episode & Varian</th>
                  <th className="pb-2.5 font-semibold">Kategori Masalah</th>
                  <th className="pb-2.5 font-semibold">Catatan / Detail</th>
                  <th className="pb-2.5 font-semibold">Status</th>
                  <th className="pb-2.5 font-semibold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-800/20">
                    <td className="py-3 font-mono text-[11px] text-zinc-400">
                      <div>{new Date(r.reportedAt).toLocaleTimeString('id-ID')}</div>
                      <div className="text-[10px] text-zinc-500">{r.id}</div>
                    </td>
                    <td className="py-3 font-mono text-[11px] text-zinc-300">
                      <div>{r.episodeId}</div>
                      <div className="text-[10px] text-zinc-500">{r.variantId}</div>
                    </td>
                    <td className="py-3">
                      <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-red-300">
                        {r.reason}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-300 max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="py-3">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        r.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : r.status === 'resolved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {r.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResolve(r.id, 'resolved')}
                            className="flex items-center gap-1 rounded bg-emerald-600/80 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-600 transition-colors cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            <span>Selesaikan</span>
                          </button>
                          <button
                            onClick={() => handleResolve(r.id, 'dismissed')}
                            className="flex items-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                            <span>Abaikan</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500">Ditutup</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: URL Allowlist & Health Ping Sandbox */}
      <div className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-sky-400" />
            <span>Sandbox Verifikasi URL & Allowlist Provider</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Uji apakah suatu URL stream memenuhi syarat domain allowlist resmi sebelum dimasukkan ke dalam matriks streaming.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="Masukkan URL embed stream (https://...)"
            className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-red-500"
          />
          <button
            onClick={handleTestUrlAllowlist}
            className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer whitespace-nowrap"
          >
            Uji Allowlist & Latensi
          </button>
        </div>

        {pingResult && (
          <div className={`rounded-lg border p-4 text-xs flex items-start gap-3 ${
            pingResult.allowed 
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' 
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {pingResult.allowed ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {pingResult.allowed ? 'Domain Diizinkan (Allowlist Terverifikasi)' : 'Ditolak oleh Keamanan'}
              </div>
              <div className="text-[11px] opacity-80 mt-0.5">
                {pingResult.allowed 
                  ? `Simulasi latensi respons: ${pingResult.latency}ms. URL aman digunakan sebagai embed player.` 
                  : pingResult.reason}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
