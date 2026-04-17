import { unstable_cache as cache } from 'next/cache';
import { prisma } from './prisma';
import { Product, LocalizedString } from './types';
import type { Product as DbProduct } from '@prisma/client';

const REVALIDATE = 60; // seconds

function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name:             { en: p.nameEn,        hy: p.nameHy,        ru: p.nameRu },
    shortDescription: { en: p.shortDescEn,   hy: p.shortDescHy,   ru: p.shortDescRu },
    description:      { en: p.descriptionEn, hy: p.descriptionHy, ru: p.descriptionRu },
    price: p.price,
    discountedPrice: p.discountedPrice ?? undefined,
    images: p.images ?? [],
    videos: p.videos ?? [],
    category: p.category as Product['category'],
    size: p.size,
    sku: p.sku,
    inStock: p.inStock,
    stockQuantity: p.stockQuantity,
    includedItems: p.includedItems ? (p.includedItems as unknown as LocalizedString[]) : undefined,
    featured: p.featured,
    bestseller: p.bestseller,
  };
}

export const getAllProducts = cache(
  async (): Promise<Product[]> => {
    const rows = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
    return rows.map(toProduct);
  },
  ['all-products'],
  { revalidate: REVALIDATE }
);

export const getFeaturedAndBestsellers = cache(
  async (): Promise<{ featured: Product[]; bestsellers: Product[] }> => {
    const [featuredRows, bestsellersRows] = await Promise.all([
      prisma.product.findMany({ where: { featured: true }, orderBy: { createdAt: 'asc' } }),
      prisma.product.findMany({ where: { bestseller: true }, orderBy: { createdAt: 'asc' } }),
    ]);
    return {
      featured: featuredRows.map(toProduct),
      bestsellers: bestsellersRows.map(toProduct),
    };
  },
  ['featured-bestsellers'],
  { revalidate: REVALIDATE }
);

export const getProductById = cache(
  async (id: string): Promise<Product | null> => {
    const row = await prisma.product.findUnique({ where: { id } });
    return row ? toProduct(row) : null;
  },
  ['product-by-id'],
  { revalidate: REVALIDATE }
);

/** Uncached — cart sync API and any dynamic id list (not unstable_cache). */
export async function fetchProductsByIdsForCart(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter(Boolean);
  if (unique.length === 0) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: unique } } });
  return rows.map(toProduct);
}
