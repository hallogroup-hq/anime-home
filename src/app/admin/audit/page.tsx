'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';

export default function AuditTrailPage() {
  const [logs] = useState(db.getAuditLogs());

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div>
        <h1 className="text-xl font-bold text-white">
          Log Audit Sistem
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Catatan riwayat tindakan yang tersimpan secara permanen.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl bg-zinc-900 border border-white/[0.08]">
        {logs.map((log) => (
          <div key={log.id} className="p-4 flex items-center justify-between text-xs">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white uppercase">{log.action}</span>
                <span className="text-zinc-400">{log.resource}</span>
              </div>
              {log.reason && (
                <span className="text-zinc-500">{log.reason}</span>
              )}
            </div>
            <span className="text-[11px] font-mono text-zinc-500 whitespace-nowrap">
              {new Date(log.timestamp).toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
