'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { History, ShieldCheck, Download } from 'lucide-react';

export default function AuditTrailPage() {
  const [logs] = useState(db.getAuditLogs());

  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `animehome-audit-trail-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-6 w-6 text-brand" />
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Immutable Audit Trail Ledger (ADM-AUDIT)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Buku besar akuntabilitas tindakan operasional admin tanpa celah pengubahan sepihak.
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="flex items-center gap-2 rounded-xl bg-surface-800 border border-border-700 px-4 py-2 text-xs font-bold text-slate-200 hover:text-white"
        >
          <Download className="h-4 w-4" />
          <span>Ekspor Log Audit (JSON)</span>
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {logs.map((log) => (
          <div
            key={log.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-900 border border-border-800"
          >
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-brand bg-brand/10 border border-brand/30 px-2 py-0.5 rounded-lg">
                  {log.action}
                </span>
                <span className="text-xs font-semibold text-white">
                  Target: {log.resource}
                </span>
              </div>
              {log.reason && (
                <p className="text-xs text-slate-300 mt-0.5">
                  Alasan: &quot;{log.reason}&quot;
                </p>
              )}
              <span className="text-[10px] text-slate-500">
                Aktor: {log.actorId} ({log.role})
              </span>
            </div>

            <span className="text-xs font-mono text-slate-400 whitespace-nowrap">
              {new Date(log.timestamp).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
