/**
 * Bulk upload images to S3-compatible object storage.
 *
 * Usage:
 *   1. Put all images in a local folder (e.g. ./uploads)
 *   2. Run: npx tsx scripts/bulk-upload.ts ./uploads
 *
 * Prints the public URLs, ready to paste into a product's images array.
 * Requires S3_ENDPOINT / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY.
 */

import './load-env';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { buildObjectKey, contentTypeFor, isS3Configured, uploadToS3 } from '../lib/s3';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov'];

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error('Usage: npx tsx scripts/bulk-upload.ts <folder-path>');
    process.exit(1);
  }

  if (!isS3Configured()) {
    console.error(
      'Storage is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.',
    );
    process.exit(1);
  }

  const files = await readdir(folder);
  const mediaFiles = files.filter((f) =>
    ALLOWED_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext))
  );

  if (mediaFiles.length === 0) {
    console.log('No image/video files found in', folder);
    return;
  }

  console.log(`Found ${mediaFiles.length} files. Uploading...\n`);

  const results: string[] = [];

  for (const file of mediaFiles) {
    const fileBuffer = await readFile(join(folder, file));

    try {
      const url = await uploadToS3(
        buildObjectKey(file),
        fileBuffer,
        contentTypeFor(file),
      );
      results.push(url);
      console.log(`OK   ${file} -> ${url}`);
    } catch (err) {
      console.error(`FAIL ${file}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('\n── Done ──────────────────────────────────');
  console.log(`Uploaded: ${results.length}/${mediaFiles.length}\n`);
  console.log('Public URLs (paste into the product images array):');
  console.log(JSON.stringify(results, null, 2));
}

main();
