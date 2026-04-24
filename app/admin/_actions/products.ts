'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { del } from '@vercel/blob';
import { prisma } from '@/lib/prisma';
import { nextSkuForCategory } from '@/lib/product-sku';
import { Prisma, ProductCategory } from '@prisma/client';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
}

function parseUrls(raw: string | null): string[] {
  if (!raw) return [];
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

function skuFromForm(formData: FormData): string {
  return String(formData.get('sku') ?? '').trim();
}

function stockQuantityFromForm(formData: FormData): number {
  const raw = formData.get('stockQuantity');
  const n = parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

async function deleteBlobUrls(urls: string[]) {
  if (urls.length === 0) return;
  await Promise.allSettled(urls.map((url) => del(url)));
}

function revalidateAll() {
  revalidateTag('products', 'max');
  revalidatePath('/admin/products');
  revalidatePath('/', 'layout');
}

export async function suggestNextSku(
  category: ProductCategory
): Promise<{ sku: string }> {
  await requireAdmin();
  const sku = await nextSkuForCategory(category);
  return { sku };
}

export async function createProduct(
  formData: FormData
): Promise<{ error: string } | void> {
  await requireAdmin();

  const category = formData.get('category') as ProductCategory;
  let sku = skuFromForm(formData);
  if (!sku) {
    sku = await nextSkuForCategory(category);
  }

  try {
    await prisma.product.create({
      data: {
        id:              crypto.randomUUID(),
        sku,
        category,
        size:            formData.get('size') as string,
        price:           parseInt(formData.get('price') as string, 10),
        discountedPrice: formData.get('discountedPrice')
          ? parseInt(formData.get('discountedPrice') as string, 10)
          : null,
        nameEn:          formData.get('nameEn') as string,
        nameHy:          formData.get('nameHy') as string,
        nameRu:          formData.get('nameRu') as string,
        shortDescEn:     formData.get('shortDescEn') as string,
        shortDescHy:     formData.get('shortDescHy') as string,
        shortDescRu:     formData.get('shortDescRu') as string,
        descriptionEn:   formData.get('descriptionEn') as string,
        descriptionHy:   formData.get('descriptionHy') as string,
        descriptionRu:   formData.get('descriptionRu') as string,
        images:          parseUrls(formData.get('images') as string),
        videos:          parseUrls(formData.get('videos') as string),
        stockQuantity:   stockQuantityFromForm(formData),
        featured:        formData.get('featured') === 'on',
        bestseller:      formData.get('bestseller') === 'on',
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002' &&
      Array.isArray(e.meta?.target) &&
      (e.meta.target as string[]).includes('sku')
    ) {
      return { error: 'Товар с таким артикулом (SKU) уже есть. Укажите другой SKU.' };
    }
    throw e;
  }

  revalidateAll();
  redirect('/admin/products');
}

export async function updateProduct(
  id: string,
  formData: FormData
): Promise<{ error: string } | void> {
  await requireAdmin();

  const existing = await prisma.product.findUnique({
    where: { id },
    select: { sku: true, images: true, videos: true },
  });

  let sku = skuFromForm(formData);
  if (!sku) sku = existing?.sku ?? '';
  if (!sku) return { error: 'Укажите артикул (SKU).' };

  const nextImages = parseUrls(formData.get('images') as string);
  const nextVideos = parseUrls(formData.get('videos') as string);

  try {
    await prisma.product.update({
      where: { id },
      data: {
        sku,
        category:        formData.get('category') as ProductCategory,
        size:            formData.get('size') as string,
        price:           parseInt(formData.get('price') as string, 10),
        discountedPrice: formData.get('discountedPrice')
          ? parseInt(formData.get('discountedPrice') as string, 10)
          : null,
        nameEn:          formData.get('nameEn') as string,
        nameHy:          formData.get('nameHy') as string,
        nameRu:          formData.get('nameRu') as string,
        shortDescEn:     formData.get('shortDescEn') as string,
        shortDescHy:     formData.get('shortDescHy') as string,
        shortDescRu:     formData.get('shortDescRu') as string,
        descriptionEn:   formData.get('descriptionEn') as string,
        descriptionHy:   formData.get('descriptionHy') as string,
        descriptionRu:   formData.get('descriptionRu') as string,
        images:          { set: nextImages },
        videos:          { set: nextVideos },
        stockQuantity:   stockQuantityFromForm(formData),
        featured:        formData.get('featured') === 'on',
        bestseller:      formData.get('bestseller') === 'on',
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002' &&
      Array.isArray(e.meta?.target) &&
      (e.meta.target as string[]).includes('sku')
    ) {
      return { error: 'Этот SKU уже занят другим товаром.' };
    }
    throw e;
  }

  const kept = new Set([...nextImages, ...nextVideos]);
  const removed = [
    ...(existing?.images ?? []),
    ...(existing?.videos ?? []),
  ].filter((url) => !kept.has(url));
  await deleteBlobUrls(removed);

  revalidateAll();
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const product = await prisma.product.findUnique({
    where: { id },
    select: { images: true, videos: true },
  });
  await prisma.product.delete({ where: { id } });
  if (product) {
    await deleteBlobUrls([...product.images, ...product.videos]);
  }
  revalidateAll();
}
