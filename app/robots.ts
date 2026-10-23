import { MetadataRoute } from 'next';
import { getConfig } from '@/lib/config';

export default function robots(): MetadataRoute.Robots {
  const config = getConfig();
  const baseUrl = config.appPublicUrl || 'https://paflegis.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
