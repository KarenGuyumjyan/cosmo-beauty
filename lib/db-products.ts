import { prisma } from './prisma';
import { Product, LocalizedString } from './types';
import type { Product as DbProduct } from '@prisma/client';
import { list } from '@vercel/blob';

async function toProduct(p: DbProduct): Promise<Product> {
  return {
    id: p.id,
    name:             { en: p.nameEn,        hy: p.nameHy,        ru: p.nameRu },
    shortDescription: { en: p.shortDescEn,   hy: p.shortDescHy,   ru: p.shortDescRu },
    description:      { en: p.descriptionEn, hy: p.descriptionHy, ru: p.descriptionRu },
    price: p.price,
    discountedPrice: p.discountedPrice ?? undefined,
    images: await signImages(p.images),
    videos: p.videos,
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
  const rows = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { createdAt: 'asc' },
  });
  return Promise.all(rows.map(toProduct));
}

export async function getBestsellers(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { bestseller: true },
    orderBy: { createdAt: 'asc' },
  });
  return Promise.all(rows.map(toProduct));
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });
  return Promise.all(rows.map(toProduct));
}

async function signImages(images: string[] | null): Promise<string[]> {
  if (!images?.length) return [];

  // fetch all blobs under uploads folder
  const { blobs } = await list({
    prefix: 'uploads/',
  });

  // create fast lookup map
  const urlMap = new Map(
    blobs.map((b) => [b.pathname, b.url])
  );

  return images.map((path) => urlMap.get(path) ?? path);
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({
    where: { id },
  });

  return row ? await toProduct(row) : null;
}
