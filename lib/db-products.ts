import { prisma } from './prisma';
import { Product, LocalizedString } from './types';
import type { Product as DbProduct } from '@prisma/client';
import { list } from '@vercel/blob';

/** Fetch the blob URL map once and reuse it for all products in a request. */
async function getBlobUrlMap(): Promise<Map<string, string>> {
  const { blobs } = await list({ prefix: 'uploads/' });
  return new Map(blobs.map((b) => [b.pathname, b.url]));
}

function resolvePaths(paths: string[] | null | undefined, urlMap: Map<string, string>): string[] {
  if (!paths?.length) return [];
  return paths.map((p) => urlMap.get(p) ?? p);
}

function toProduct(p: DbProduct, urlMap: Map<string, string>): Product {
  return {
    id: p.id,
    name:             { en: p.nameEn,        hy: p.nameHy,        ru: p.nameRu },
    shortDescription: { en: p.shortDescEn,   hy: p.shortDescHy,   ru: p.shortDescRu },
    description:      { en: p.descriptionEn, hy: p.descriptionHy, ru: p.descriptionRu },
    price: p.price,
    discountedPrice: p.discountedPrice ?? undefined,
    images: resolvePaths(p.images, urlMap),
    videos: resolvePaths(p.videos, urlMap),
    category: p.category as Product['category'],
    size: p.size,
    sku: p.sku,
    inStock: p.inStock,
    includedItems: p.includedItems ? (p.includedItems as unknown as LocalizedString[]) : undefined,
    featured: p.featured,
    bestseller: p.bestseller,
  };
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const [rows, urlMap] = await Promise.all([
    prisma.product.findMany({ where: { featured: true }, orderBy: { createdAt: 'asc' } }),
    getBlobUrlMap(),
  ]);
  return rows.map((p) => toProduct(p, urlMap));
}

export async function getBestsellers(): Promise<Product[]> {
  const [rows, urlMap] = await Promise.all([
    prisma.product.findMany({ where: { bestseller: true }, orderBy: { createdAt: 'asc' } }),
    getBlobUrlMap(),
  ]);
  return rows.map((p) => toProduct(p, urlMap));
}

export async function getAllProducts(): Promise<Product[]> {
  const [rows, urlMap] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'asc' } }),
    getBlobUrlMap(),
  ]);
  return rows.map((p) => toProduct(p, urlMap));
}

/** Fetches featured + bestseller products with a single Blob list() call. */
export async function getFeaturedAndBestsellers(): Promise<{
  featured: Product[];
  bestsellers: Product[];
}> {
  const [featuredRows, bestsellersRows, urlMap] = await Promise.all([
    prisma.product.findMany({ where: { featured: true }, orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ where: { bestseller: true }, orderBy: { createdAt: 'asc' } }),
    getBlobUrlMap(),
  ]);
  return {
    featured: featuredRows.map((p) => toProduct(p, urlMap)),
    bestsellers: bestsellersRows.map((p) => toProduct(p, urlMap)),
  };
}

export async function getProductById(id: string): Promise<Product | null> {
  const [row, urlMap] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    getBlobUrlMap(),
  ]);
  return row ? toProduct(row, urlMap) : null;
}
