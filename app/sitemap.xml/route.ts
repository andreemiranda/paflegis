import { NextRequest, NextResponse } from 'next/server';
import { getConfig, resolveRequestOrigin } from '@/lib/config';
import { api } from '@/lib/sapl/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const origin = resolveRequestOrigin(req.headers);
  const now = new Date().toISOString();

  const staticRoutes = [
    { path: '', priority: '1.0', changefreq: 'daily' },
    { path: '/materias', priority: '0.9', changefreq: 'daily' },
    { path: '/normas', priority: '0.9', changefreq: 'daily' },
    { path: '/sessoes', priority: '0.9', changefreq: 'daily' },
    { path: '/parlamentares', priority: '0.9', changefreq: 'weekly' },
    { path: '/mesa-diretora', priority: '0.9', changefreq: 'weekly' },
    { path: '/comissoes', priority: '0.8', changefreq: 'weekly' },
    { path: '/documentos', priority: '0.8', changefreq: 'daily' },
    { path: '/audiencias', priority: '0.7', changefreq: 'weekly' },
    { path: '/busca', priority: '0.8', changefreq: 'daily' },
    { path: '/contato', priority: '0.7', changefreq: 'monthly' },
    { path: '/sobre', priority: '0.6', changefreq: 'monthly' },
    { path: '/api-docs', priority: '0.7', changefreq: 'weekly' },
    { path: '/seo-audit', priority: '0.5', changefreq: 'monthly' },
    { path: '/privacidade', priority: '0.4', changefreq: 'monthly' },
    { path: '/privacidade/central', priority: '0.4', changefreq: 'monthly' },
    { path: '/cookies', priority: '0.4', changefreq: 'monthly' },
    { path: '/termos', priority: '0.4', changefreq: 'monthly' },
    { path: '/aviso-legal', priority: '0.4', changefreq: 'monthly' },
    { path: '/dados-publicos', priority: '0.8', changefreq: 'daily' },
  ];

  // Busca lista oficial de parlamentares da API
  let vereadorRoutes: { path: string; priority: string; changefreq: string }[] = [];
  try {
    const list = await api.getAllParlamentares();
    vereadorRoutes = list.map((p) => ({
      path: `/parlamentares/${p.id}`,
      priority: '0.8',
      changefreq: 'weekly',
    }));
  } catch {
    // Fallback gracioso
  }

  const allRoutes = [...staticRoutes, ...vereadorRoutes];

  const xmlEntries = allRoutes
    .map(
      (r) => `  <url>
    <loc>${origin}${r.path}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join('\n');

  const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  return new NextResponse(xmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
