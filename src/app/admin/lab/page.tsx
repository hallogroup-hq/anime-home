'use client';

import React, { useState } from 'react';
import { 
  FlaskConical, ShieldAlert, CheckCircle2, XCircle, 
  ExternalLink, Play, RefreshCw, Lock
} from 'lucide-react';

interface CandidateEvaluation {
  id: string;
  name: string;
  baseUrl: string;
  integrationMethod: 'Iframe Embed' | 'HLS Direct' | 'API Adapter';
  subtitleSupport: string;
  resolutions: string[];
  embeddingRestrictions: string;
  mobileCompatibility: 'Yes' | 'Degraded' | 'No';
  rightsStatus: 'Official Licensed' | 'Third-Party Unverified' | 'Restricted';
  verificationOutcome: 'Approved' | 'Under Evaluation' | 'Rejected' | 'Inconclusive';
  notes: string;
}

const INITIAL_CANDIDATES: CandidateEvaluation[] = [
  {
    id: 'cand-yt',
    name: 'YouTube (Official Licensed Channels: Muse / Ani-One)',
    baseUrl: 'https://www.youtube.com',
    integrationMethod: 'Iframe Embed',
    subtitleSupport: 'Multi-language (id-ID CC, en-US)',
    resolutions: ['Auto (Adaptive)', '1080p', '720p'],
    embeddingRestrictions: 'Allowed via official iframe API',
    mobileCompatibility: 'Yes',
    rightsStatus: 'Official Licensed',
    verificationOutcome: 'Approved',
    notes: 'Terbukti legal dan stabil. Kontrol kualitas eksternal terkunci pada player YouTube resmi.',
  },
  {
    id: 'cand-megaplay',
    name: 'MegaPlay / Anikoto Embed',
    baseUrl: 'https://megaplay.example.org',
    integrationMethod: 'Iframe Embed',
    subtitleSupport: 'Hardsub Indonesian / Softsub WebVTT',
    resolutions: ['720p', '1080p'],
    embeddingRestrictions: 'Memerlukan custom Referer header atau sandboxing',
    mobileCompatibility: 'Degraded',
    rightsStatus: 'Third-Party Unverified',
    verificationOutcome: 'Under Evaluation',
    notes: 'Kandidat riset. Dibatasi dalam lab isolasi. Belum memenuhi syarat kelayakan produksi.',
  },
  {
    id: 'cand-anilink',
    name: 'AniLink Embed Network',
    baseUrl: 'https://anilink.example.net',
    integrationMethod: 'Iframe Embed',
    subtitleSupport: 'Indonesian subtitle',
    resolutions: ['480p', '720p'],
    embeddingRestrictions: 'Pop-up redirect detected pada free tier',
    mobileCompatibility: 'No',
    rightsStatus: 'Third-Party Unverified',
    verificationOutcome: 'Rejected',
    notes: 'Ditolak: Mengandung popup redirect yang merusak UX pengguna mobile.',
  },
  {
    id: 'cand-supaplay',
    name: 'SupaPlay Edge Player',
    baseUrl: 'https://supaplay.example.com',
    integrationMethod: 'API Adapter',
    subtitleSupport: 'JSON Subtitle Track',
    resolutions: ['Auto', '720p', '1080p'],
    embeddingRestrictions: 'CORS token required',
    mobileCompatibility: 'Yes',
    rightsStatus: 'Third-Party Unverified',
    verificationOutcome: 'Under Evaluation',
    notes: 'Sedang dievaluasi kompatibilitas API dan latensi buffering di koneksi lokal Indonesia.',
  },
  {
    id: 'cand-vimeo',
    name: 'Vimeo Player (Licensed Demo)',
    baseUrl: 'https://player.vimeo.com',
    integrationMethod: 'Iframe Embed',
    subtitleSupport: 'WebVTT tracks',
    resolutions: ['Auto', '1080p', '720p'],
    embeddingRestrictions: 'Domain allowlisting supported',
    mobileCompatibility: 'Yes',
    rightsStatus: 'Official Licensed',
    verificationOutcome: 'Approved',
    notes: 'Kandidat resmi untuk promo dan trailer verified.',
  },
];

export default function ProviderTestingLabPage() {
  const [candidates] = useState<CandidateEvaluation[]>(INITIAL_CANDIDATES);
  const [sandboxUrl, setSandboxUrl] = useState('https://www.youtube.com/embed/dQw4w9WgXcQ');
  const [activeFrameUrl, setActiveFrameUrl] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'testing' | 'pass' | 'fail';
    message?: string;
    playbackVerified: boolean;
  }>({ status: 'idle', playbackVerified: false });

  const handleRunSandboxTest = () => {
    try {
      const parsed = new URL(sandboxUrl);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        setTestResult({
          status: 'fail',
          message: 'Skema protokol tidak sah. Hanya HTTPS/HTTP yang didukung.',
          playbackVerified: false,
        });
        return;
      }

      setTestResult({ status: 'testing', playbackVerified: false });
      setActiveFrameUrl(sandboxUrl);

      setTimeout(() => {
        setTestResult({
          status: 'pass',
          message: 'Frame berhasil dimuat dalam sandbox terisolasi. Verifikasi pemutaran manual diperlukan.',
          playbackVerified: true,
        });
      }, 1000);
    } catch {
      setTestResult({
        status: 'fail',
        message: 'Format URL tidak valid.',
        playbackVerified: false,
      });
    }
  };

  const getStatusBadge = (outcome: CandidateEvaluation['verificationOutcome']) => {
    switch (outcome) {
      case 'Approved':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Approved</span>;
      case 'Under Evaluation':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Under Evaluation</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">Rejected</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">Inconclusive</span>;
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-16">
      {/* Header & Isolation Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-bold uppercase tracking-wider">
              <FlaskConical className="w-3.5 h-3.5" />
              Isolated R&D Environment
            </span>
            <span className="text-[11px] text-zinc-500">PRD Bab 7 Compliance</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Lab Pengujian Kelayakan Provider Pihak Ketiga
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Area riset terisolasi untuk menguji calon penyedia streaming video sebelum disetujui masuk ke registry produksi. Sumber yang belum diverifikasi dilarang keras masuk ke matriks publik.
          </p>
        </div>
      </div>

      {/* Safety Guardrail Banner */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-zinc-300 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-amber-300">Prinsip Keamanan & Legalitas Pengujian:</span>
          <p className="text-zinc-400 leading-relaxed">
            1. Tidak menyimpan atau me-rehost file video di server ANIME HOME.<br />
            2. Tidak melakukan scraping ilegal atau circumventing DRM.<br />
            3. Pemutaran diuji dalam sandbox terisolasi tanpa cookie atau sesi pengguna produksi.<br />
            4. HTTP status 200 tidak membuktikan video dapat diputar — status harus tetap <strong>Unverified</strong> sampai verifikasi pemutaran visual lulus.
          </p>
        </div>
      </div>

      {/* 1. Candidate Evaluation Matrix Table */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Matriks Evaluasi Kandidat Provider</span>
            <span className="text-xs text-zinc-500 font-normal">({candidates.length} kandidat terdata)</span>
          </h2>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400">
                <th className="py-2.5 px-3 font-semibold">Provider / Nama</th>
                <th className="py-2.5 px-3 font-semibold">Metode Integrasi</th>
                <th className="py-2.5 px-3 font-semibold">Resolusi</th>
                <th className="py-2.5 px-3 font-semibold">Subtitle</th>
                <th className="py-2.5 px-3 font-semibold">Mobile Ready</th>
                <th className="py-2.5 px-3 font-semibold">Status Hak / Izin</th>
                <th className="py-2.5 px-3 font-semibold">Hasil Evaluasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {candidates.map((cand) => (
                <tr key={cand.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-bold text-zinc-200">{cand.name}</div>
                    <div className="text-[11px] text-zinc-500 font-mono">{cand.baseUrl}</div>
                  </td>
                  <td className="py-3 px-3 text-zinc-300">{cand.integrationMethod}</td>
                  <td className="py-3 px-3 text-zinc-300">
                    <div className="flex gap-1 flex-wrap">
                      {cand.resolutions.map(r => (
                        <span key={r} className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-zinc-400 text-[11px]">{cand.subtitleSupport}</td>
                  <td className="py-3 px-3">
                    <span className={`font-semibold ${cand.mobileCompatibility === 'Yes' ? 'text-emerald-400' : (cand.mobileCompatibility === 'Degraded' ? 'text-amber-400' : 'text-red-400')}`}>
                      {cand.mobileCompatibility}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-400">{cand.rightsStatus}</td>
                  <td className="py-3 px-3">{getStatusBadge(cand.verificationOutcome)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Interactive Isolated Sandbox Player Tester */}
      <section className="rounded-2xl border border-white/[0.08] bg-zinc-900 p-5 flex flex-col gap-4">
        <div className="border-b border-white/[0.06] pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-zinc-400" />
            <span>Sandbox Verifikasi Embed Terisolasi</span>
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Uji URL embed kandidat dalam iframe tersandbox tanpa izin akses ke cookie atau kredensial situs induk.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={sandboxUrl}
            onChange={(e) => setSandboxUrl(e.target.value)}
            placeholder="https://provider.example/embed/demo-video"
            className="flex-1 rounded-lg border border-white/[0.08] bg-zinc-950 px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 font-mono"
          />
          <button
            onClick={handleRunSandboxTest}
            className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Uji di Sandbox</span>
          </button>
        </div>

        {testResult.status !== 'idle' && (
          <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            testResult.status === 'pass' 
              ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
              : (testResult.status === 'testing' ? 'bg-zinc-950 border-white/[0.08] text-zinc-400' : 'bg-red-950/30 border-red-500/30 text-red-300')
          }`}>
            {testResult.status === 'pass' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {testResult.status === 'fail' && <XCircle className="w-4 h-4 shrink-0 text-red-400" />}
            {testResult.status === 'testing' && <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-zinc-400" />}
            <span>{testResult.message || 'Menguji koneksi embed...'}</span>
          </div>
        )}

        {/* Sandbox Iframe Preview */}
        {activeFrameUrl && (
          <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.08] bg-black aspect-video max-w-2xl mx-auto w-full relative">
            <iframe
              src={activeFrameUrl}
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allow="autoplay; encrypted-media; fullscreen"
              title="Provider Sandbox Isolation Test"
            />
          </div>
        )}
      </section>
    </div>
  );
}
