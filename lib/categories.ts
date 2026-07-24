import { unstable_cache as cache } from 'next/cache';
import { prisma } from './prisma';
import type { CategoryOption, Category, Locale } from './types';

/**
 * Categories for the storefront (value + localized labels), sorted for display.
 * Cached and tagged so admin edits can revalidate it (revalidateTag('categories')).
 */
export const getCategories = cache(
  async (): Promise<CategoryOption[]> => {
    const rows = await prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { nameRu: 'asc' }],
    });
    return rows.map((c) => ({
      value: c.slug,
      label: { en: c.nameEn, hy: c.nameHy, ru: c.nameRu },
    }));
  },
  ['all-categories'],
  { revalidate: 60, tags: ['categories'] },
);

/** Full category rows for the admin (includes skuPrefix / sortOrder). Uncached. */
export function getCategoriesForAdmin() {
  return prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { nameRu: 'asc' }],
  });
}

/** Localized label lookup for server components. */
export function categoryLabel(
  categories: CategoryOption[],
  value: Category,
  locale: Locale,
): string {
  return categories.find((c) => c.value === value)?.label[locale] ?? value;
}
