import { PrismaClient, ProductCategory } from '@prisma/client';
import { products } from '../lib/newData';

const prisma = new PrismaClient();

const SKU_PREFIX: Record<string, string> = {
  cosmetic_sponges:  'SP',
  lip_liner:         'LL',
  blush:             'BL',
  stick:             'ST',
  lip_gloss:         'LG',
  highlighter:       'LB',
  concealer:         'CO',
  eyeshadow_palette: 'EP',
  setting_spray:     'SS',
  false_eyelashes:   'FE',
};

async function nextSku(category: string): Promise<string> {
  const code = SKU_PREFIX[category];
  if (!code) throw new Error(`Unknown category: ${category}`);

  const base = `CSM-${code}-`;
  const rows = await prisma.product.findMany({
    where: { sku: { startsWith: base } },
    select: { sku: true },
  });

  const re = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\d+)$`);
  let max = 0;
  for (const row of rows) {
    const m = row.sku.match(re);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${base}${String(max + 1).padStart(3, '0')}`;
}

async function main() {
  console.log(`Seeding ${products.length} new products…\n`);

  let created = 0;

  for (const p of products) {
    const sku = await nextSku(p.category);

    await prisma.product.create({
      data: {
        id:              crypto.randomUUID(),
        nameEn:          p.nameEn,
        nameHy:          p.nameHy,
        nameRu:          p.nameRu,
        shortDescEn:     p.shortDescEn,
        shortDescHy:     p.shortDescHy,
        shortDescRu:     p.shortDescRu,
        descriptionEn:   p.descriptionEn,
        descriptionHy:   p.descriptionHy,
        descriptionRu:   p.descriptionRu,
        price:           p.price,
        discountedPrice: p.discountedPrice ?? null,
        images:          [],
        videos:          [],
        category:        p.category as ProductCategory,
        size:            p.size ?? '',
        sku,
        inStock:         true,
        featured:        false,
        bestseller:      false,
      },
    });

    created++;
    console.log(`  [${created}/${products.length}] ${sku} — ${p.nameEn}`);
  }

  console.log(`\nDone! Created ${created} products.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
