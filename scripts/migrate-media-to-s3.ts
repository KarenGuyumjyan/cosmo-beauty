/**
 * Move product media off Vercel Blob and onto S3-compatible storage.
 *
 * For every product image/video URL still pointing at Vercel Blob it
 * downloads the file, uploads it to S3, and rewrites the URL in the database.
 *
 * Safe to re-run: URLs already on S3 are skipped, and each product is updated
 * only after all of its files have transferred successfully — a partial
 * failure leaves that product untouched rather than half-migrated.
 *
 * Usage:
 *   npx tsx scripts/migrate-media-to-s3.ts --dry-run   # report only
 *   npx tsx scripts/migrate-media-to-s3.ts             # perform the migration
 */

import './load-env';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import {
  contentTypeFor,
  isS3Configured,
  keyFromPublicUrl,
  uploadToS3,
} from '../lib/s3';
import { jsonToStringArray } from '../lib/json-array';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Anything not already served from our own bucket needs moving.
 *
 * Delegates to `keyFromPublicUrl`, which matches on the full base URL
 * (scheme + host + port + bucket path). Comparing hostnames alone would treat
 * a different port or a different bucket on the same host as "already
 * migrated" and silently skip those files.
 */
function needsMigration(url: string): boolean {
  if (!/^https?:\/\//i.test(url)) return false;
  return keyFromPublicUrl(url) === null;
}

/** Filename from a URL path, used to build a readable object key. */
function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split('/').filter(Boolean).pop() ?? 'file');
  } catch {
    return 'file';
  }
}

/**
 * Deterministic object key derived from the SOURCE url.
 *
 * Unlike new uploads (which use a random suffix), the migration must produce
 * the same key for the same source file every time: the migration may be run
 * against more than one database (e.g. a local copy and production), and a
 * random suffix would upload every photo again under a new name. Hashing the
 * source URL makes the whole migration idempotent across runs and machines.
 */
function migratedKey(sourceUrl: string): string {
  const name = filenameFromUrl(sourceUrl);
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : '';
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'file';
  const hash = createHash('sha256').update(sourceUrl).digest('hex').slice(0, 16);
  return `products/${stem}-${hash}${ext}`;
}

const cache = new Map<string, string>();

async function transfer(url: string): Promise<string> {
  const cached = cache.get(url);
  if (cached) return cached; // the same photo is reused across products

  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (${res.status})`);

  const body = await res.arrayBuffer();
  if (body.byteLength === 0) throw new Error('downloaded 0 bytes');

  const newUrl = await uploadToS3(
    migratedKey(url),
    body,
    res.headers.get('content-type') || contentTypeFor(filenameFromUrl(url)),
  );

  cache.set(url, newUrl);
  return newUrl;
}

async function main() {
  if (!isS3Configured()) {
    console.error(
      'Storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.',
    );
    process.exit(1);
  }

  const products = await prisma.product.findMany({
    select: { id: true, sku: true, images: true, videos: true },
  });

  let productsChanged = 0;
  let filesMoved = 0;
  let filesSkipped = 0;
  const failures: Array<{ sku: string; url: string; error: string }> = [];

  for (const p of products) {
    const images = jsonToStringArray(p.images);
    const videos = jsonToStringArray(p.videos);
    const pending = [...images, ...videos].filter(needsMigration);

    if (pending.length === 0) {
      filesSkipped += images.length + videos.length;
      continue;
    }

    if (DRY_RUN) {
      console.log(`${p.sku}: would move ${pending.length} file(s)`);
      productsChanged++;
      filesMoved += pending.length;
      continue;
    }

    const mapped = new Map<string, string>();
    let failed = false;

    for (const url of pending) {
      try {
        mapped.set(url, await transfer(url));
      } catch (e) {
        failed = true;
        failures.push({
          sku: p.sku,
          url,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }

    // All-or-nothing per product: never leave a product with a mix of moved
    // and stale URLs.
    if (failed) {
      console.error(`${p.sku}: SKIPPED - ${failures.filter((f) => f.sku === p.sku).length} file(s) failed`);
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        images: images.map((u) => mapped.get(u) ?? u),
        videos: videos.map((u) => mapped.get(u) ?? u),
      },
    });

    productsChanged++;
    filesMoved += mapped.size;
    console.log(`${p.sku}: moved ${mapped.size} file(s)`);
  }

  console.log('\n── Summary ───────────────────────────────');
  console.log(`Products ${DRY_RUN ? 'to update' : 'updated'} : ${productsChanged}/${products.length}`);
  console.log(`Files    ${DRY_RUN ? 'to move' : 'moved'}    : ${filesMoved}`);
  console.log(`Files already on S3    : ${filesSkipped}`);
  console.log(`Unique files uploaded  : ${cache.size}`);

  if (failures.length) {
    console.log(`\n${failures.length} file(s) FAILED - their products were left unchanged:`);
    for (const f of failures) console.log(`  ${f.sku}  ${f.error}  ${f.url}`);
    console.log('\nRe-run the script to retry them.');
    process.exitCode = 1;
  } else if (!DRY_RUN && productsChanged > 0) {
    console.log('\nAll media migrated to S3.');
  }
}

main()
  .catch((e: unknown) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
