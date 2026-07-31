/**
 * PHASE 2 of the Postgres -> MySQL data migration.
 *
 * Loads `prisma/data-export.json` (written by `export-postgres.ts`) into the
 * MySQL/MariaDB database that DATABASE_URL points at.
 *
 * Handles the shape differences between the two databases:
 *  - `images` / `videos`: Postgres `text[]` -> MySQL JSON array
 *  - `category`: old `ProductCategory` enum value -> Category table row (rows
 *    are created from the canonical list if the source had no Category table)
 *  - columns added after the source DB was last migrated (cdekStatus, the
 *    shipping dimensions) default to null
 *
 * Idempotent: every row is upserted by primary key, so re-running is safe.
 *
 * Usage:
 *   DATABASE_URL="mysql://user:pass@host:3306/db" npx tsx prisma/import-mysql.ts
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, Prisma } from '@prisma/client';
import { CATEGORIES, fallbackSkuPrefix } from './categories-data';

const IN_FILE = join(process.cwd(), 'prisma', 'data-export.json');
const prisma = new PrismaClient();

type Row = Record<string, unknown>;

/** Postgres text[] (or a JSON string) -> plain string[]. */
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return toStringArray(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function str(row: Row, key: string, fallback = ''): string {
  const v = row[key];
  return typeof v === 'string' ? v : v == null ? fallback : String(v);
}

function numOrNull(row: Row, key: string): number | null {
  const v = row[key];
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function num(row: Row, key: string, fallback: number): number {
  return numOrNull(row, key) ?? fallback;
}

function boolOf(row: Row, key: string, fallback = false): boolean {
  const v = row[key];
  return typeof v === 'boolean' ? v : v == null ? fallback : Boolean(v);
}

function dateOf(row: Row, key: string): Date {
  const v = row[key];
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(0);
}

/** Pass JSON columns through, normalizing undefined -> DbNull. */
function jsonOrNull(value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull {
  if (value == null) return Prisma.DbNull;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Prisma.InputJsonValue;
    } catch {
      return Prisma.DbNull;
    }
  }
  return value as Prisma.InputJsonValue;
}

const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];

function orderStatus(row: Row): OrderStatus {
  const raw = str(row, 'status', 'PENDING').toUpperCase();
  return (ORDER_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatus)
    : 'PENDING';
}

async function main() {
  if (!existsSync(IN_FILE)) {
    console.error(
      `No export file at ${IN_FILE}.\nRun \`npm run db:export\` against the old Postgres database first.`,
    );
    process.exit(1);
  }

  const payload = JSON.parse(readFileSync(IN_FILE, 'utf8')) as {
    tables: Record<string, Row[]>;
  };
  const t = payload.tables ?? {};
  const get = (name: string): Row[] => (Array.isArray(t[name]) ? t[name] : []);

  const srcCategories = get('Category');
  const srcProducts = get('Product');
  const srcOrders = get('Order');
  const srcOrderItems = get('OrderItem');
  const srcContacts = get('ContactApplication');
  const srcAdmins = get('AdminUser');

  // ── Categories ───────────────────────────────────────────────────────────
  // Union of: rows in the dump, the canonical list, and any category value
  // referenced by a product (so no product can fail its foreign key).
  const canonical = new Map(CATEGORIES.map((c) => [c.slug, { ...c }]));
  const categoryRows = new Map<string, {
    slug: string; nameEn: string; nameHy: string; nameRu: string;
    skuPrefix: string; sortOrder: number;
  }>();

  for (const c of srcCategories) {
    const slug = str(c, 'slug');
    if (!slug) continue;
    categoryRows.set(slug, {
      slug,
      nameEn: str(c, 'nameEn', slug),
      nameHy: str(c, 'nameHy', slug),
      nameRu: str(c, 'nameRu', slug),
      skuPrefix: str(c, 'skuPrefix', canonical.get(slug)?.skuPrefix ?? fallbackSkuPrefix(slug)),
      sortOrder: num(c, 'sortOrder', 0),
    });
  }

  for (const p of srcProducts) {
    const slug = str(p, 'category');
    if (!slug || categoryRows.has(slug)) continue;
    const known = canonical.get(slug);
    categoryRows.set(slug, known ?? {
      slug,
      nameEn: slug, nameHy: slug, nameRu: slug,
      skuPrefix: fallbackSkuPrefix(slug),
      sortOrder: 999,
    });
  }

  // Keep SKU prefixes unique - the column has a unique index.
  const usedPrefixes = new Set<string>();
  for (const row of categoryRows.values()) {
    let prefix = (row.skuPrefix || fallbackSkuPrefix(row.slug)).toUpperCase().slice(0, 4);
    let n = 1;
    while (usedPrefixes.has(prefix)) prefix = `${prefix.slice(0, 3)}${n++}`;
    usedPrefixes.add(prefix);
    row.skuPrefix = prefix;
  }

  for (const row of categoryRows.values()) {
    await prisma.category.upsert({
      where: { slug: row.slug },
      update: row,
      create: row,
    });
  }
  console.log(`Categories : ${categoryRows.size}`);

  // ── Products ─────────────────────────────────────────────────────────────
  let productCount = 0;
  for (const p of srcProducts) {
    const id = str(p, 'id');
    if (!id) continue;
    const data = {
      nameEn: str(p, 'nameEn'),
      nameHy: str(p, 'nameHy'),
      nameRu: str(p, 'nameRu'),
      shortDescEn: str(p, 'shortDescEn'),
      shortDescHy: str(p, 'shortDescHy'),
      shortDescRu: str(p, 'shortDescRu'),
      descriptionEn: str(p, 'descriptionEn'),
      descriptionHy: str(p, 'descriptionHy'),
      descriptionRu: str(p, 'descriptionRu'),
      price: num(p, 'price', 0),
      discountedPrice: numOrNull(p, 'discountedPrice'),
      // text[] -> JSON array
      images: toStringArray(p.images),
      videos: toStringArray(p.videos),
      category: str(p, 'category'),
      size: str(p, 'size'),
      weightGrams: numOrNull(p, 'weightGrams'),
      lengthCm: numOrNull(p, 'lengthCm'),
      widthCm: numOrNull(p, 'widthCm'),
      heightCm: numOrNull(p, 'heightCm'),
      sku: str(p, 'sku', id),
      stockQuantity: num(p, 'stockQuantity', 0),
      includedItems: jsonOrNull(p.includedItems),
      featured: boolOf(p, 'featured'),
      bestseller: boolOf(p, 'bestseller'),
      createdAt: dateOf(p, 'createdAt'),
      updatedAt: dateOf(p, 'updatedAt'),
    };
    await prisma.product.upsert({ where: { id }, update: data, create: { id, ...data } });
    productCount++;
  }
  console.log(`Products   : ${productCount}`);

  // ── Orders ───────────────────────────────────────────────────────────────
  let orderCount = 0;
  for (const o of srcOrders) {
    const id = str(o, 'id');
    if (!id) continue;
    const data = {
      customerName: str(o, 'customerName'),
      customerPhone: str(o, 'customerPhone'),
      customerEmail: (o.customerEmail as string | null) ?? null,
      address: (o.address as string | null) ?? null,
      city: (o.city as string | null) ?? null,
      shippingMethod: str(o, 'shippingMethod'),
      cityCode: numOrNull(o, 'cityCode'),
      pickupPointCode: (o.pickupPointCode as string | null) ?? null,
      pickupPointName: (o.pickupPointName as string | null) ?? null,
      pickupPointAddress: (o.pickupPointAddress as string | null) ?? null,
      tariffCode: numOrNull(o, 'tariffCode'),
      cdekPrice: numOrNull(o, 'cdekPrice'),
      finalPrice: numOrNull(o, 'finalPrice'),
      shippingCost: num(o, 'shippingCost', 0),
      subtotal: num(o, 'subtotal', 0),
      total: num(o, 'total', 0),
      status: orderStatus(o),
      yookassaId: (o.yookassaId as string | null) ?? null,
      yookassaStatus: (o.yookassaStatus as string | null) ?? null,
      cdekUuid: (o.cdekUuid as string | null) ?? null,
      cdekTrackingNumber: (o.cdekTrackingNumber as string | null) ?? null,
      cdekRawResponse: jsonOrNull(o.cdekRawResponse),
      cdekStatus: (o.cdekStatus as string | null) ?? null,
      createdAt: dateOf(o, 'createdAt'),
    };
    await prisma.order.upsert({ where: { id }, update: data, create: { id, ...data } });
    orderCount++;
  }
  console.log(`Orders     : ${orderCount}`);

  // ── Order items ──────────────────────────────────────────────────────────
  // Skip rows whose parent order or product didn't survive, rather than
  // aborting the whole import on a foreign-key error.
  const orderIds = new Set(srcOrders.map((o) => str(o, 'id')));
  const productIds = new Set(srcProducts.map((p) => str(p, 'id')));
  let itemCount = 0;
  const skippedItems: string[] = [];
  for (const it of srcOrderItems) {
    const id = str(it, 'id');
    const orderId = str(it, 'orderId');
    const productId = str(it, 'productId');
    if (!id) continue;
    if (!orderIds.has(orderId) || !productIds.has(productId)) {
      skippedItems.push(id);
      continue;
    }
    const data = {
      orderId,
      productId,
      quantity: num(it, 'quantity', 1),
      price: num(it, 'price', 0),
    };
    await prisma.orderItem.upsert({ where: { id }, update: data, create: { id, ...data } });
    itemCount++;
  }
  console.log(`OrderItems : ${itemCount}${skippedItems.length ? ` (skipped ${skippedItems.length} orphaned)` : ''}`);

  // ── Contact applications ─────────────────────────────────────────────────
  let contactCount = 0;
  for (const c of srcContacts) {
    const id = str(c, 'id');
    if (!id) continue;
    const data = {
      name: str(c, 'name'),
      phone: str(c, 'phone'),
      message: (c.message as string | null) ?? null,
      createdAt: dateOf(c, 'createdAt'),
    };
    await prisma.contactApplication.upsert({ where: { id }, update: data, create: { id, ...data } });
    contactCount++;
  }
  console.log(`Contacts   : ${contactCount}`);

  // ── Admin users ──────────────────────────────────────────────────────────
  let adminCount = 0;
  for (const a of srcAdmins) {
    const id = str(a, 'id');
    const email = str(a, 'email');
    if (!id || !email) continue;
    const data = {
      email,
      passwordHash: str(a, 'passwordHash'),
      createdAt: dateOf(a, 'createdAt'),
    };
    await prisma.adminUser.upsert({ where: { id }, update: data, create: { id, ...data } });
    adminCount++;
  }
  console.log(`Admins     : ${adminCount}`);

  if (skippedItems.length) {
    console.warn(
      `\nWARNING: ${skippedItems.length} order item(s) referenced a missing order or product and were skipped.`,
    );
  }
  console.log('\nImport complete. Run `npm run db:verify` to check the result.');
}

main()
  .catch((e: unknown) => {
    console.error('Import failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
