import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const origin = parsedTarget.origin;

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: 'https://s13.nontonanimeid.boats/',
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

    // 1. Neutralize domain lock / embed guard scripts that restrict iframe embedding
    html = html.replace(
      /<script[^>]+embed-guard\.js[^>]*><\/script>/gi,
      '<!-- embed guard neutralized for verified in-app player -->'
    );

    // 2. Inject <base> tag so all relative assets (JWPlayer, scripts, stylesheets) resolve to origin host
    if (!html.includes('<base ') && html.includes('<head>')) {
      html = html.replace('<head>', `<head><base href="${origin}/">`);
    }

    // 3. Return sanitized HTML with permissive iframe embedding headers
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        // Explicitly clear restrictive frame ancestors so our player can embed it
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  } catch (error: any) {
    console.error('[EmbedProxy] Proxy error:', error.message);
    return new NextResponse(`Error proxying stream: ${error.message}`, { status: 502 });
  }
}
