import { NextRequest, NextResponse } from 'next/server';
import { isAllowedStreamHost } from '@/lib/services/streamSecurity';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  // 1. Strict Hostname Allowlist Check (Prevent SSRF & Open Proxy Abuse)
  if (!isAllowedStreamHost(targetUrl)) {
    return new NextResponse('Host upstream tidak diizinkan. Akses proxy ditolak.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  // 2. Anti-Leech & Anti-Hotlinking Referer Check
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
    return new NextResponse('Akses proxy ditolak: Penggunaan proxy hanya diizinkan di Anime Home.', {
      status: 403,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const origin = parsedTarget.origin;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: origin,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!response.ok) {
      return new NextResponse(`Upstream server returned error: ${response.status}`, {
        status: response.status,
      });
    }

    let html = await response.text();

    // 3. Neutralize domain lock / embed guard scripts that restrict in-app player
    html = html.replace(
      /<script[^>]+embed-guard\.js[^>]*><\/script>/gi,
      '<!-- embed guard neutralized for verified in-app player -->'
    );

    // 4. Inject <base> tag so all relative assets resolve to origin host
    if (!html.includes('<base ') && html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${origin}/">`);
    }

    // 5. Return sanitized HTML with frame ancestors locked to same-origin
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch (error: any) {
    console.error('[EmbedProxy] Proxy error:', error.message);
    return new NextResponse(`Error proxying stream: ${error.message}`, { status: 502 });
  }
}
