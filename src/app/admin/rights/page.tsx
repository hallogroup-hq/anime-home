'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { AlertOctagon, CheckCircle2, ShieldCheck, History, Undo2 } from 'lucide-react';

export default function RightsTakedownPage() {
  const [takedownReason, setTakedownReason] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('var-f8-720-beta');
  const [statusMessage, setStatusMessage] = useState('');
  const [auditLogs, setAuditLogs] = useState(db.getAuditLogs());

  const handleTakedown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!takedownReason) return;
    const ok = db.emergencyPauseSource(selectedVariantId, takedownReason);
    if (ok) {
      setStatusMessage(`Sumber [${selectedVariantId}] berhasil di-takedown seketika dan dihapus dari watch page publik.`);
      setTakedownReason('');
      setAuditLogs(db.getAuditLogs());
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  const handleRestore = (variantId: string) => {
    const ok = db.restoreSource(variantId);
    if (ok) {
      setStatusMessage(`Sumber [${variantId}] berhasil dipulihkan setelah verifikasi hak cipta.`);
      setAuditLogs(db.getAuditLogs());
      setTimeout(() => setStatusMessage(''), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-6 w-6 text-rose-500" />
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Konsol Hak Cipta & Emergency Takedown (ADM-RIGHTS & SOP-05)
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Hentikan sumber penayangan yang bermasalah secara hukum seketika. Sumber yang ditakedown langsung hilang dari pilihan server di sisi publik.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/40 p-4 text-xs font-bold text-rose-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          {statusMessage}
        </div>
      )}

      {/* Emergency Form */}
      <form onSubmit={handleTakedown} className="rounded-3xl border border-border-700 bg-surface-900 p-6 flex flex-col gap-4">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-rose-500" />
          Formulir Penarikan Sumber Penayangan (Takedown Rehearsal)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Pilih ID Sumber / Varian:</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
            >
              <option value="var-f8-720-beta">var-f8-720-beta (Server Beta - FastStream 720p)</option>
              <option value="var-f8-720-delta">var-f8-720-delta (Server Delta - EdgeMirror 720p)</option>
              <option value="var-f8-1080-epsilon">var-f8-1080-epsilon (Server Epsilon - VIP 1080p)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">Dasar Tuntutan / Alasan Legal:</label>
            <input
              type="text"
              required
              placeholder="Contoh: Notice of DMCA / distributor request ID-2026-09"
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              className="rounded-xl bg-ink-950 border border-border-700 p-2.5 text-xs text-white focus:outline-none focus:border-brand"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-2">
          <button
            type="submit"
            className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
          >
            <AlertOctagon className="h-4 w-4" />
            <span>Eksekusi Emergency Takedown Sekarang</span>
          </button>
        </div>
      </form>

      {/* Audit Trail Riwayat Aksi */}
      <section className="flex flex-col gap-3 rounded-3xl bg-surface-900 border border-border-800 p-6">
        <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
          <History className="h-4 w-4 text-slate-400" />
          Audit Trail Log Penegakan Hak & Operasional
        </h3>

        <div className="flex flex-col gap-2">
          {auditLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-ink-950 border border-border-800 text-xs"
            >
              <div>
                <span className="font-bold text-brand uppercase mr-2">[{log.action}]</span>
                <span className="text-white font-medium">{log.resource}</span>
                {log.reason && <span className="text-slate-400 ml-2">— {log.reason}</span>}
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
