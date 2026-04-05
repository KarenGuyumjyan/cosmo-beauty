import type { ProductCategory } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/** Middle segment after CSM- (matches existing seed data, e.g. blush → CSM-BL-001). */
export const SKU_PREFIX_BY_CATEGORY: Record<ProductCategory, string> = {
  cosmetic_sponges: 'SP',
  lip_liner:        'LL',
  blush:            'BL',
  stick:            'ST',
  lip_gloss:        'LG',
  highlighter:      'LB',
  concealer:        'CO',
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Next SKU for category: CSM-{code}-{nnn} with nnn one higher than existing matches. */
export async function nextSkuForCategory(category: ProductCategory): Promise<string> {
  const code = SKU_PREFIX_BY_CATEGORY[category];
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
