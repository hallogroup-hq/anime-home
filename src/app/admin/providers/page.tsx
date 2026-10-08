'use client';

import { useState } from 'react';
import { db } from '@/lib/services/store';
import { Provider } from '@/types';
import { Plus, Check, ShieldCheck, ShieldAlert, Globe } from 'lucide-react';

export default function ProvidersRegistryPage() {
  const [providers, setProviders] = useState(db.getAllProviders());
  const [showAddForm, setShowAddForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [providerType, setProviderType] = useState<Provider['providerType']>('embed');
  const [apiAdapterKey, setApiAdapterKey] = useState<Provider['apiAdapterKey']>('custom_embed');
  const [termsUrl, setTermsUrl] = useState('');

  const refreshList = () => {
    setProviders(db.getAllProviders());
  };

  const handleCreateProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !domain) return;

    db.addProvider({
      name,
      domain,
      providerType,
      apiAdapterKey,
      status: 'active',
      termsUrl: termsUrl || undefined,
    });

    refreshList();
    setShowAddForm(false);
    setName('');
    setDomain('');
    setTermsUrl('');
    setSuccessMessage(`Provider "${name}" berhasil didaftarkan ke registry.`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleToggleStatus = (providerId: string, currentStatus: Provider['status']) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    db.updateProviderStatus(providerId, nextStatus);
    refreshList();
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Registry Provider & Adapter Streaming
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Daftar domain penyedia video yang diizinkan (whitelisted) dan konfigurasi adapter pemutar.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Registrasi Provider Baru</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-500/40 bg-zinc-900 p-3.5 text-xs text-emerald-400 flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* FORM REGISTRASI PROVIDER BARU */}
      {showAddForm && (
        <form onSubmit={handleCreateProvider} className="rounded-xl border border-white/[0.1] bg-zinc-900 p-5 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Registrasi Domain Provider Baru
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Nama Provider:</label>
              <input
                type="text"
                required
                placeholder="Contoh: Server Gamma ID"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Domain Whitelist:</label>
              <input
                type="text"
                required
                placeholder="stream.cdn-node.org"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Kunci Adapter API:</label>
              <select
                value={apiAdapterKey}
                onChange={(e) => setApiAdapterKey(e.target.value as any)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              >
                <option value="custom_embed">Custom Embed Iframe</option>
                <option value="youtube">YouTube Official Adapter</option>
                <option value="direct_stream">Direct Stream HLS/DASH</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-zinc-400 font-semibold">Tautan Syarat / Lisensi:</label>
              <input
                type="url"
                placeholder="https://provider.com/terms"
                value={termsUrl}
                onChange={(e) => setTermsUrl(e.target.value)}
                className="rounded-lg bg-zinc-950 border border-zinc-700 p-2 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Simpan Provider
            </button>
          </div>
        </form>
      )}

      {/* DAFTAR PROVIDER TERDAFTAR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {providers.map((p) => {
          const isHealthy = p.status === 'active';
          return (
            <div
              key={p.id}
              className="rounded-xl border border-white/[0.08] bg-zinc-900 p-4 flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{p.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    isHealthy ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
                  }`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1.5">
                  <Globe className="h-3 w-3 text-zinc-500" />
                  <span>{p.domain}</span>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-zinc-500 mt-2">
                  <span>Adapter: <code className="text-zinc-400">{p.apiAdapterKey}</code></span>
                  <span>•</span>
                  <span>Tipe: {p.providerType}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between">
                <button
                  onClick={() => handleToggleStatus(p.id, p.status)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                    isHealthy
                      ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700'
                      : 'bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800'
                  }`}
                >
                  {isHealthy ? 'Pause Provider' : 'Aktifkan Kembali'}
                </button>

                <span className="text-[10px] text-zinc-500">{p.id}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
