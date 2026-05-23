/**
 * Bulk upload images to Vercel Blob.
 *
 * Usage:
 *   1. Put all images in a local folder (e.g. ./uploads)
 *   2. Run: npx tsx scripts/bulk-upload.ts ./uploads
 *
 * It will upload every file in that folder to Vercel Blob under "uploads/"
 * and print the blob paths you can use in the database.
 */

import { put } from '@vercel/blob';
import { readdir, readFile } from 'fs/promises';
import { join, basename } from 'path';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.mov'];

async function main() {
  const folder = process.argv[2];
  if (!folder) {
    console.error('Usage: npx tsx scripts/bulk-upload.ts <folder-path>');
    process.exit(1);
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('Missing BLOB_READ_WRITE_TOKEN in .env');
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
    const filePath = join(folder, file);
    const fileBuffer = await readFile(filePath);
    const blobPath = `uploads/${basename(file)}`;

    try {
      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        token,
      });
      results.push(blob.pathname);
      console.log(`✅ ${file} → ${blob.pathname}`);
    } catch (err) {
      console.error(`❌ ${file} - failed:`, err);
    }
  }

  console.log('\n── Done ──────────────────────────────────');
  console.log(`Uploaded: ${results.length}/${mediaFiles.length}\n`);
  console.log('Blob paths (paste into DB images array):');
  console.log(JSON.stringify(results, null, 2));
}

main();
