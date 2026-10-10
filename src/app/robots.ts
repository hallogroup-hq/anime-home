import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://anime-home-psi.vercel.app';

export default function robots(): MetadataRoute.Robots {
  const aiBots = [
    'GPTBot',
    'ChatGPT-User',
    'OAI-SearchBot',
    'PerplexityBot',
    'ClaudeBot',
    'anthropic-ai',
    'Google-Extended',
    'Googlebot',
    'Googlebot-Image',
    'Googlebot-Video',
    'Bingbot',
    'Applebot',
    'Applebot-Extended',
    'cohere-ai',
    'Bytespider',
    'DuckDuckBot',
  ];

  const botRules = aiBots.map((bot) => ({
    userAgent: bot,
    allow: ['/', '/anime', '/anime/*', '/watch/*', '/schedule', '/discover', '/llms.txt', '/llms-full.txt'],
    disallow: ['/admin/', '/api/admin/', '/api/dropship/', '/me'],
  }));

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/dropship/', '/me'],
      },
      ...botRules,
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
