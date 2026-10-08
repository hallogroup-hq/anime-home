'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';

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
      setStatusMessage(`Sumber [${selectedVariantId}] dinonaktifkan dari pemutar publik.`);
      setTakedownReason('');
      setAuditLogs(db.getAuditLogs());
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">
          Takedown & Keluhan Hak Cipta
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Menonaktifkan server yang bermasalah secara langsung dari sisi publik.
        </p>
      </div>

      {statusMessage && (
        <div className="rounded-lg bg-zinc-900 border border-red-500/40 p-3 text-xs text-red-400">
          {statusMessage}
        </div>
      )}

      {/* Form Takedown */}
      <form onSubmit={handleTakedown} className="rounded-xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">
          Formulir Takedown Cepat
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex flex-col gap-1">
            <label className="text-zinc-400">ID Varian Server:</label>
            <select
              value={selectedVariantId}
              onChange={(e) => setSelectedVariantId(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
            >
              <option value="var-f8-720-beta">var-f8-720-beta (Server Beta 720p)</option>
              <option value="var-f8-720-delta">var-f8-720-delta (Server Delta 720p)</option>
              <option value="var-f8-1080-epsilon">var-f8-1080-epsilon (Server Epsilon 1080p)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-zinc-400">Alasan / Referensi Tiket:</label>
            <input
              type="text"
              required
              placeholder="Contoh: Tiket DMCA #4928"
              value={takedownReason}
              onChange={(e) => setTakedownReason(e.target.value)}
              className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end mt-2">
          <button
            type="submit"
            className="rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white transition-colors"
          >
            Eksekusi Takedown
          </button>
        </div>
      </form>

      {/* Log Riwayat */}
      <section className="flex flex-col gap-2 rounded-xl bg-zinc-900 border border-white/[0.08] p-5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
          Riwayat Audit Terakhir
        </h3>

        <div className="flex flex-col divide-y divide-white/[0.06]">
          {auditLogs.slice(0, 5).map((log) => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-red-500 mr-2">[{log.action}]</span>
                <span className="text-zinc-200">{log.resource}</span>
                {log.reason && <span className="text-zinc-500 ml-2">- {log.reason}</span>}
              </div>
              <span className="text-[10px] text-zinc-500">
                {new Date(log.timestamp).toLocaleTimeString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
