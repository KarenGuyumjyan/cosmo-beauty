'use client';

import { createContext, useContext, useMemo } from 'react';
import type { CategoryOption, Category, Locale } from '@/lib/types';

const CategoryContext = createContext<CategoryOption[]>([]);

/**
 * Provides the DB-backed category list to client components. Mounted once in the
 * root layout with categories fetched server-side, so components like ProductCard
 * or FilterPanel can resolve category labels without importing a static table.
 */
export function CategoryProvider({
  categories,
  children,
}: {
  categories: CategoryOption[];
  children: React.ReactNode;
}) {
  return (
    <CategoryContext.Provider value={categories}>
      {children}
    </CategoryContext.Provider>
  );
}

/** All categories (value + localized labels), in display order. */
export function useCategories(): CategoryOption[] {
  return useContext(CategoryContext);
}

/** Returns a `(slug, locale) => label` resolver backed by the current categories. */
export function useCategoryLabel(): (value: Category, locale: Locale) => string {
  const categories = useContext(CategoryContext);
  return useMemo(
    () => (value: Category, locale: Locale) =>
      categories.find((c) => c.value === value)?.label[locale] ?? value,
    [categories],
  );
}
