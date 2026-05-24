import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';
import { routing } from '@/i18n/routing';
import { BASE_URL } from '@/lib/seo';

const locales = routing.locales;

const buildAlternates = (path: string) =>
  Object.fromEntries(
    locales.map((l) => [l, `${BASE_URL}/${l}${path}`]),
  );

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // One canonical entry per (locale × path) with hreflang alternates.
  // Cart / checkout / order / terms are intentionally excluded - they're
  // user-specific transactional routes that should not be indexed.
  const staticPages = [
    { path: '', changeFrequency: 'daily' as const, priority: 1.0 },
    { path: '/catalog', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
    { path: '/documents/privacy-policy', changeFrequency: 'yearly' as const, priority: 0.2 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(
    ({ path, changeFrequency, priority }) =>
      locales.map((locale) => ({
        url: `${BASE_URL}/${locale}${path}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
        alternates: { languages: buildAlternates(path) },
      })),
  );

  const products = await prisma.product.findMany({
    where: { stockQuantity: { gt: 0 } },
    select: { id: true, updatedAt: true },
  });

  const productEntries: MetadataRoute.Sitemap = products.flatMap((p) => {
    const path = `/product/${p.id}`;
    return locales.map((locale) => ({
      url: `${BASE_URL}/${locale}${path}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: { languages: buildAlternates(path) },
    }));
  });

  return [...staticEntries, ...productEntries];
}
