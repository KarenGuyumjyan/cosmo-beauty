/**
 * Post-migration health check for the MySQL/MariaDB database.
 *
 * Exercises the things most likely to break in a Postgres -> MySQL move:
 * connectivity, the JSON array columns that replaced `String[]`, foreign keys,
 * enum round-tripping, utf8mb4 (Cyrillic/Armenian) storage, and the exact
 * queries the app runs at request time.
 *
 * Exits non-zero if any check fails, so it can gate a deploy.
 *
 * Usage:  DATABASE_URL="mysql://..." npx tsx prisma/verify-mysql.ts
 */
import { PrismaClient } from '@prisma/client';
import { jsonToStringArray } from '../lib/json-array';

const prisma = new PrismaClient();

let passed = 0;
const failures: string[] = [];

function check(name: string, ok: boolean, detail = '') {
  if (ok) {
    passed++;
    console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ''}`);
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  console.log('Verifying MySQL/MariaDB database…\n');

  // 1. Connectivity + engine
  const version = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    'SELECT VERSION() AS v',
  );
  const engine = String(version[0]?.v ?? 'unknown');
  check('connects to database', Boolean(engine), engine);

  // 2. Charset must be utf8mb4, or Cyrillic/Armenian text corrupts
  const charset = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT DEFAULT_CHARACTER_SET_NAME AS cs FROM information_schema.SCHEMATA
     WHERE SCHEMA_NAME = DATABASE()`,
  );
  const cs = String(charset[0]?.cs ?? '');
  check('database charset is utf8mb4', cs === 'utf8mb4', cs || 'unknown');

  // 3. Table counts
  const [categories, products, orders, orderItems, contacts, admins] =
    await Promise.all([
      prisma.category.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.orderItem.count(),
      prisma.contactApplication.count(),
      prisma.adminUser.count(),
    ]);
  console.log(
    `\n  rows: categories=${categories} products=${products} orders=${orders} ` +
      `orderItems=${orderItems} contacts=${contacts} admins=${admins}\n`,
  );
  check('all tables queryable', true);
  check('has at least one category', categories > 0, `${categories}`);

  // 4. JSON array columns behave like the old String[]
  const withMedia = await prisma.product.findMany({
    select: { id: true, sku: true, images: true, videos: true },
  });
  const badJson = withMedia.filter((p) => {
    const imgs = jsonToStringArray(p.images);
    const vids = jsonToStringArray(p.videos);
    return !Array.isArray(imgs) || !Array.isArray(vids);
  });
  check('images/videos parse as string arrays', badJson.length === 0,
    badJson.length ? `${badJson.length} bad rows` : `${withMedia.length} products`);

  const productsWithImages = withMedia.filter((p) => jsonToStringArray(p.images).length > 0);
  check('products have images', products === 0 || productsWithImages.length > 0,
    `${productsWithImages.length}/${products}`);

  // Image order matters (images[0] is the main image) - verify round-trip.
  if (productsWithImages.length > 0) {
    const sample = productsWithImages[0];
    const urls = jsonToStringArray(sample.images);
    const reread = await prisma.product.findUnique({
      where: { id: sample.id },
      select: { images: true },
    });
    const rereadUrls = jsonToStringArray(reread?.images);
    check('image order is preserved',
      JSON.stringify(urls) === JSON.stringify(rereadUrls),
      `${urls.length} urls, first=${urls[0]?.slice(0, 40) ?? 'n/a'}…`);
  }

  // 5. Foreign keys are real (MySQL silently ignores them on MyISAM)
  const fks = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT CONSTRAINT_NAME AS name FROM information_schema.TABLE_CONSTRAINTS
     WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
  );
  check('foreign keys exist', fks.length >= 3, `${fks.length} constraints`);

  const engines = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND ENGINE <> 'InnoDB'`,
  );
  check('all tables use InnoDB', Number(engines[0]?.n ?? 0) === 0);

  // 6. Every category slug referenced by a product actually exists.
  // (The FK makes orphans impossible, so this catches a missing/disabled
  // constraint rather than ordinary data drift.)
  const usedSlugs = await prisma.product.findMany({
    distinct: ['category'],
    select: { category: true },
  });
  const knownSlugs = new Set(
    (await prisma.category.findMany({ select: { slug: true } })).map((c) => c.slug),
  );
  const orphanSlugs = usedSlugs
    .map((p) => p.category)
    .filter((slug) => !knownSlugs.has(slug));
  check('every product category resolves', orphanSlugs.length === 0,
    orphanSlugs.length ? `missing: ${orphanSlugs.join(', ')}` : `${usedSlugs.length} slugs all resolve`);

  // 7. Relation traversal (the query the order page runs)
  const orderWithItems = await prisma.order.findFirst({
    include: { items: { include: { product: true } } },
  });
  check('order -> items -> product join works',
    orders === 0 || orderWithItems !== null,
    orders === 0 ? 'no orders to check' : `order ${orderWithItems?.id?.slice(0, 8)}…`);

  // 8. Enum round-trip
  if (orders > 0) {
    const statuses = await prisma.order.groupBy({
      by: ['status'],
      _count: { _all: true },
    });
    check('OrderStatus enum reads back', statuses.length > 0,
      statuses.map((s) => `${s.status}=${s._count._all}`).join(' '));
  }

  // 9. groupBy / aggregate (used by the admin dashboard + categories page)
  const grouped = await prisma.product.groupBy({
    by: ['category'],
    _count: { _all: true },
  });
  check('groupBy works', grouped.length > 0 || products === 0,
    `${grouped.length} category groups`);

  const agg = await prisma.order.aggregate({ _sum: { total: true } });
  check('aggregate works', true, `sum(total)=${agg._sum.total ?? 0}`);

  // 10. Multibyte text survived (Cyrillic / Armenian)
  const cyrillic = await prisma.product.findFirst({
    where: { nameRu: { not: '' } },
    select: { nameRu: true, nameHy: true },
  });
  if (cyrillic) {
    const hasCyrillic = /[Ѐ-ӿ]/.test(cyrillic.nameRu);
    check('Cyrillic text intact', hasCyrillic, cyrillic.nameRu.slice(0, 30));
    const hasArmenian = /[԰-֏]/.test(cyrillic.nameHy);
    check('Armenian text intact', hasArmenian, cyrillic.nameHy.slice(0, 30));
  }

  // 11. Unique constraints enforced
  const dupSku = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    'SELECT sku FROM Product GROUP BY sku HAVING COUNT(*) > 1',
  );
  check('SKUs are unique', dupSku.length === 0,
    dupSku.length ? `${dupSku.length} duplicates` : 'no duplicates');

  // 12. Write path: the JSON column accepts a plain array and reads back
  const probeSlug = '__verify_probe__';
  try {
    await prisma.category.upsert({
      where: { slug: probeSlug },
      update: {},
      create: {
        slug: probeSlug, nameEn: 'Probe', nameHy: 'Probe', nameRu: 'Проба',
        skuPrefix: 'ZZ9', sortOrder: 9999,
      },
    });
    const probeId = '__verify_probe_product__';
    await prisma.product.upsert({
      where: { id: probeId },
      update: { images: ['a.jpg', 'b.jpg', 'c.jpg'] },
      create: {
        id: probeId, nameEn: 'P', nameHy: 'P', nameRu: 'П',
        shortDescEn: 's', shortDescHy: 's', shortDescRu: 'с',
        descriptionEn: 'd', descriptionHy: 'd', descriptionRu: 'д',
        price: 1, images: ['a.jpg', 'b.jpg', 'c.jpg'], videos: [],
        category: probeSlug, size: '1', sku: '__VERIFY_PROBE__',
      },
    });
    const readBack = await prisma.product.findUnique({
      where: { id: probeId }, select: { images: true, videos: true },
    });
    const urls = jsonToStringArray(readBack?.images);
    check('JSON write/read round-trip', JSON.stringify(urls) === JSON.stringify(['a.jpg', 'b.jpg', 'c.jpg']),
      JSON.stringify(urls));
    check('empty JSON array round-trips', jsonToStringArray(readBack?.videos).length === 0);

    // FK must block deleting a category that still has products.
    let blocked = false;
    try {
      await prisma.category.delete({ where: { slug: probeSlug } });
    } catch {
      blocked = true;
    }
    check('FK blocks deleting a category with products', blocked);

    await prisma.product.delete({ where: { id: probeId } });
    await prisma.category.delete({ where: { slug: probeSlug } });
    check('probe rows cleaned up', true);
  } catch (e) {
    check('JSON write/read round-trip', false, String(e).slice(0, 120));
    // Best-effort cleanup so a failed probe doesn't leave junk behind.
    await prisma.product.deleteMany({ where: { sku: '__VERIFY_PROBE__' } }).catch(() => {});
    await prisma.category.deleteMany({ where: { slug: probeSlug } }).catch(() => {});
  }

  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('\nFailures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log('All checks passed.');
}

main()
  .catch((e: unknown) => {
    console.error('Verification crashed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
