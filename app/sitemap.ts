import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { routing } from '@/i18n/routing';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://morena-cosmetics.ru';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = routing.locales;

  // Static pages — one canonical entry per locale with hreflang alternates
  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/catalog', changeFrequency: 'weekly' as const, priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(({ path, changeFrequency, priority }) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency,
      priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}${path}`])
        ),
      },
    }))
  );

  // Product pages
  const products = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    select: { id: true, updatedAt: true },
  });

  const productEntries: MetadataRoute.Sitemap = products.flatMap((p) =>
    locales.map((locale) => ({
      url: `${BASE_URL}/${locale}/product/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${BASE_URL}/${l}/product/${p.id}`])
        ),
      },
    }))
  );

  return [...staticEntries, ...productEntries];
}
