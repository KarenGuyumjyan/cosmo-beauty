'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { auth } from '@/auth';

async function requireAdmin() {
  const session = await auth();
  if (!session) throw new Error('Unauthorized');
}

function revalidateAll() {
  revalidateTag('categories', 'max');
  revalidatePath('/admin/categories');
  revalidatePath('/', 'layout');
}

/** Normalize a slug: lowercase, spaces/dashes → underscore, strip other chars. */
function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

type ParsedCategory = {
  nameRu: string;
  nameEn: string;
  nameHy: string;
  skuPrefix: string;
  sortOrder: number;
};

function parseCategory(formData: FormData): ParsedCategory | { error: string } {
  const nameRu = String(formData.get('nameRu') ?? '').trim();
  const nameEn = String(formData.get('nameEn') ?? '').trim();
  const nameHy = String(formData.get('nameHy') ?? '').trim();
  const skuPrefix = String(formData.get('skuPrefix') ?? '')
    .trim()
    .toUpperCase();
  const sortOrderRaw = parseInt(String(formData.get('sortOrder') ?? ''), 10);
  const sortOrder = Number.isFinite(sortOrderRaw) ? sortOrderRaw : 0;

  if (!nameRu || !nameEn || !nameHy) {
    return { error: 'Укажите название на всех языках (RU, EN, HY).' };
  }
  if (!/^[A-Z0-9]{2,4}$/.test(skuPrefix)) {
    return { error: 'Префикс артикула — 2–4 латинских буквы или цифры (например BL).' };
  }

  return { nameRu, nameEn, nameHy, skuPrefix, sortOrder };
}

function isUniqueViolation(e: unknown, field: string): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2002' &&
    Array.isArray(e.meta?.target) &&
    (e.meta.target as string[]).includes(field)
  );
}

export async function createCategory(
  formData: FormData,
): Promise<{ error: string } | void> {
  await requireAdmin();

  const slug = normalizeSlug(String(formData.get('slug') ?? ''));
  if (!slug) {
    return { error: 'Укажите системное имя (slug), например lip_gloss.' };
  }

  const parsed = parseCategory(formData);
  if ('error' in parsed) return parsed;

  try {
    await prisma.category.create({ data: { slug, ...parsed } });
  } catch (e) {
    if (isUniqueViolation(e, 'slug')) {
      return { error: 'Категория с таким системным именем (slug) уже существует.' };
    }
    if (isUniqueViolation(e, 'skuPrefix')) {
      return { error: 'Этот префикс артикула уже используется другой категорией.' };
    }
    throw e;
  }

  revalidateAll();
  redirect('/admin/categories');
}

export async function updateCategory(
  slug: string,
  formData: FormData,
): Promise<{ error: string } | void> {
  await requireAdmin();

  const parsed = parseCategory(formData);
  if ('error' in parsed) return parsed;

  try {
    await prisma.category.update({ where: { slug }, data: parsed });
  } catch (e) {
    if (isUniqueViolation(e, 'skuPrefix')) {
      return { error: 'Этот префикс артикула уже используется другой категорией.' };
    }
    throw e;
  }

  revalidateAll();
  redirect('/admin/categories');
}

export async function deleteCategory(
  slug: string,
): Promise<{ error: string } | void> {
  await requireAdmin();

  const productCount = await prisma.product.count({ where: { category: slug } });
  if (productCount > 0) {
    return {
      error: `Нельзя удалить: в категории ${productCount} товар(ов). Сначала перенесите или удалите их.`,
    };
  }

  await prisma.category.delete({ where: { slug } });
  revalidateAll();
}
