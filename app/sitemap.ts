import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://paflegis.vercel.app';
  const now = new Date();

  const staticPages = [
    '',
    '/materias',
    '/normas',
    '/sessoes',
    '/contato',
    '/sobre',
    '/api-docs',
    '/seo-audit',
    '/privacidade',
    '/privacidade/central',
    '/cookies',
    '/termos',
    '/aviso-legal',
    '/dados-publicos',
  ];

  return staticPages.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '' || path === '/materias' || path === '/normas' || path === '/sessoes' ? 'daily' : 'monthly',
    priority: path === '' ? 1.0 : path.startsWith('/privacidade') || path.startsWith('/termos') ? 0.3 : 0.8,
  }));
}
