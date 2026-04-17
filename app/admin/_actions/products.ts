'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { nextSkuForCategory } from '@/lib/product-sku';
import { Prisma, ProductCategory } from '@prisma/client';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
}

function parseUrls(raw: string): string[] {
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
        inStock:         formData.get('inStock') === 'on',
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
      return { error: 'A product with this SKU already exists. Use a different SKU.' };
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

  let sku = skuFromForm(formData);
  if (!sku) {
    const row = await prisma.product.findUnique({
      where: { id },
      select: { sku: true },
    });
    sku = row?.sku ?? '';
  }
  if (!sku) return { error: 'SKU is required.' };

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
        images:          parseUrls(formData.get('images') as string),
        videos:          parseUrls(formData.get('videos') as string),
        inStock:         formData.get('inStock') === 'on',
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
      return { error: 'Another product already uses this SKU.' };
    }
    throw e;
  }

  revalidateAll();
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidateAll();
}
