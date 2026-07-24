import { prisma } from '@/lib/prisma';

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Next SKU for a category: CSM-{prefix}-{nnn} with nnn one higher than the
 * highest existing match. The prefix comes from the Category row (skuPrefix);
 * unknown categories fall back to 'XX'.
 */
export async function nextSkuForCategory(categorySlug: string): Promise<string> {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    select: { skuPrefix: true },
  });
  const code = category?.skuPrefix ?? 'XX';
  const base = `CSM-${code}-`;
  const rows = await prisma.product.findMany({
    where: { sku: { startsWith: base } },
    select: { sku: true },
  });
  const re = new RegExp(`^${escapeRegExp(base)}(\\d+)$`);
  let max = 0;
  for (const row of rows) {
    const m = row.sku.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${base}${String(max + 1).padStart(3, '0')}`;
}
