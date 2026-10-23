import { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const config = getConfig();
  const baseUrl = config.appPublicUrl || 'https://paflegis.vercel.app';
  const now = new Date();

  const staticPages = [
    '',
    '/materias',
    '/normas',
    '/sessoes',
    '/parlamentares',
    '/comissoes',
    '/audiencias',
    '/busca',
    '/documentos',
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
    changeFrequency:
      path === '' || path === '/materias' || path === '/normas' || path === '/sessoes'
        ? 'daily'
        : 'monthly',
    priority:
      path === ''
        ? 1.0
        : path.startsWith('/privacidade') || path.startsWith('/termos')
        ? 0.3
        : 0.8,
  }));
}
