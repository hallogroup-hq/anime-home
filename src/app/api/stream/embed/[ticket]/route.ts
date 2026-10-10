import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/services/store';
import { verifyStreamTicket, isAllowedStreamHost } from '@/lib/services/streamSecurity';

export const dynamic = 'force-dynamic';

interface RouteProps {
  params: Promise<{ ticket: string }>;
}

export async function GET(request: NextRequest, { params }: RouteProps) {
  const { ticket } = await params;

  // 1. Validasi tiket kriptografis
  const verification = verifyStreamTicket(ticket);
  if (!verification.valid || !verification.data) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Tiket Streaming Tidak Valid</title>
        <style>
          body { background: #090A0F; color: #fff; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { text-align: center; padding: 24px; max-width: 400px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: #12131A; }
          h2 { font-size: 15px; margin: 0 0 8px; color: #ef4444; }
          p { font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Akses Video Kedaluwarsa</h2>
          <p>${verification.reason || 'Sesi tiket streaming tidak valid. Silakan muat ulang halaman tonton.'}</p>
        </div>
      </body>
      </html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // 2. Proteksi Anti-Scraping / Anti-Hotlink (Referer & Origin Check)
  const referer = request.headers.get('referer') || '';
  const host = request.headers.get('host') || '';

  const isAllowedReferer =
    !referer ||
    referer.includes(host) ||
    referer.includes('anime-home-psi.vercel.app') ||
    referer.includes('vercel.app') ||
    referer.includes('localhost') ||
    referer.includes('127.0.0.1');

  if (!isAllowedReferer) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Akses Ditolak (403)</title>
        <style>
          body { background: #090A0F; color: #fff; font-family: ui-sans-serif, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { text-align: center; padding: 24px; max-width: 440px; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: #12131A; }
          h2 { font-size: 15px; margin: 0 0 8px; color: #f59e0b; }
          p { font-size: 12px; color: #a1a1aa; line-height: 1.5; margin: 0; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Tautan Video Dilindungi</h2>
          <p>Stream ini dilindungi oleh sistem keamanan Anime Home dan tidak dapat di-scrape atau di-hotlink dari luar. Silakan tonton langsung melalui website resmi Anime Home.</p>
        </div>
      </body>
      </html>`,
      {
        status: 403,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // 3. Resolusi Varian Sumber Asli di Sisi Server (Hidden from Client)
  const variant = db.getVariantById(verification.data.variantId);
  if (!variant) {
    return new NextResponse(
      `<!DOCTYPE html><html><body style="background:#090A0F;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;">
          <h2 style="font-size:14px;color:#a1a1aa;">Sumber video tidak ditemukan atau telah diarsipkan</h2>
        </div>
      </body></html>`,
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }

  // Cek apakah target URL adalah host resmi yang diizinkan (Mencegah SSRF)
  const rawUrl = variant.embedUrl;
  const isApproved = isAllowedStreamHost(rawUrl) || rawUrl.startsWith('/embed/');
  if (!isApproved) {
    return new NextResponse('Host sumber video tidak terdaftar dalam allowlist keamanan.', { status: 400 });
  }

  // 4. Bangun Gateway Player HTML yang Bersih & Aman
  // Menghilangkan watermark luar, menyematkan pelindung klik kanan dan anti-inspect
  const securePlayerHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <title>Anime Home Secure Stream</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
    #player-wrap { position: relative; width: 100%; height: 100%; background: #000; }
    iframe { width: 100%; height: 100%; border: 0; display: block; }
    /* Proteksi Watermark & Anti-Right-Click */
    .top-shield {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 38px;
      background: linear-gradient(180deg, rgba(9,10,15,0.92) 0%, rgba(9,10,15,0.4) 70%, transparent 100%);
      pointer-events: none;
      z-index: 25;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    .top-shield .brand {
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      opacity: 0.85;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .top-shield .dot {
      width: 6px; height: 6px; border-radius: 50%; background: #ef4444; display: inline-block;
    }
    .top-shield .info {
      color: #71717a;
      font-size: 10px;
      font-weight: 500;
    }
  </style>
</head>
<body oncontextmenu="return false;">
  <div id="player-wrap">
    <div class="top-shield">
      <span class="brand"><span class="dot"></span>ANIME HOME PLAYER</span>
      <span class="info">${verification.data.quality || 'HD'} • Terverifikasi</span>
    </div>
    <iframe
      id="stream-core"
      src="${rawUrl}"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
    ></iframe>
  </div>
  <script>
    // Cegah pintasan tombol inspect element di dalam iframe
    document.addEventListener('keydown', function(e) {
      if (e.keyCode === 123 || (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74)) || (e.ctrlKey && e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
    });
  </script>
</body>
</html>`;

  return new NextResponse(securePlayerHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'same-origin',
      'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      // Mengizinkan iframe hanya disematkan pada domain Anime Home
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
