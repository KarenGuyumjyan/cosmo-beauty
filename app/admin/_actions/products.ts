'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ProductCategory } from '@prisma/client';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
}

function parseUrls(raw: string): string[] {
  return raw.split('\n').map((s) => s.trim()).filter(Boolean);
}

function revalidateAll() {
  revalidatePath('/admin/products');
  // Revalidate all locale store pages (home, catalog, product pages)
  revalidatePath('/', 'layout');
}

export async function createProduct(formData: FormData) {
  await requireAdmin();

  await prisma.product.create({
    data: {
      id:              crypto.randomUUID(),
      sku:             formData.get('sku') as string,
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
      featured:        formData.get('featured') === 'on',
      bestseller:      formData.get('bestseller') === 'on',
    },
  });

  revalidateAll();
  redirect('/admin/products');
}

export async function updateProduct(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.product.update({
    where: { id },
    data: {
      sku:             formData.get('sku') as string,
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
      featured:        formData.get('featured') === 'on',
      bestseller:      formData.get('bestseller') === 'on',
    },
  });

  revalidateAll();
  redirect('/admin/products');
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  await prisma.product.delete({ where: { id } });
  revalidateAll();
}
