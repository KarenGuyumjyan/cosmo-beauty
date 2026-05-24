import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/',
          '/api/',
          '/cart',
          '/checkout',
          '/order/',
          '/*/cart',
          '/*/checkout',
          '/*/order/',
          // Disallow filtered/sorted catalog query strings - keeps the
          // canonical `/catalog` clean in the index.
          '/*?cat=*',
          '/*?sort=*',
          '/*?q=*',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
