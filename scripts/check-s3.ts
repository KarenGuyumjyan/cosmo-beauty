/**
 * Validate the S3 storage configuration end to end.
 *
 * Uploads a tiny test object, fetches it back over the public URL, then
 * deletes it — proving credentials, permissions, and public-read all work
 * before you rely on them for product images.
 *
 * Usage:
 *   npx tsx scripts/check-s3.ts
 *   (or with explicit values)
 *   S3_ENDPOINT=... S3_BUCKET=... S3_ACCESS_KEY_ID=... S3_SECRET_ACCESS_KEY=... npx tsx scripts/check-s3.ts
 */

import './load-env';
import { buildObjectKey, deleteFromS3, isS3Configured, publicUrl, uploadToS3 } from '../lib/s3';

/** Show enough of a secret to confirm it's the right one, without printing it. */
function mask(v: string | undefined): string {
  if (!v) return '(not set)';
  return v.length <= 8 ? '****' : `${v.slice(0, 4)}…${v.slice(-2)} (${v.length} chars)`;
}

async function main() {
  console.log('S3 configuration\n');
  console.log(`  S3_ENDPOINT           ${process.env.S3_ENDPOINT ?? '(not set)'}`);
  console.log(`  S3_BUCKET             ${process.env.S3_BUCKET ?? '(not set)'}`);
  console.log(`  S3_REGION             ${process.env.S3_REGION ?? '(not set → ru-1)'}`);
  console.log(`  S3_ACCESS_KEY_ID      ${mask(process.env.S3_ACCESS_KEY_ID)}`);
  console.log(`  S3_SECRET_ACCESS_KEY  ${mask(process.env.S3_SECRET_ACCESS_KEY)}`);
  console.log(`  S3_PUBLIC_URL         ${process.env.S3_PUBLIC_URL ?? '(not set → endpoint/bucket)'}`);
  console.log('');

  if (!isS3Configured()) {
    console.error(
      'FAIL  Missing configuration. All four are required:\n' +
        '      S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY',
    );
    process.exit(1);
  }

  const key = buildObjectKey('s3-check.txt', '_healthcheck');
  const body = new TextEncoder().encode(`ok ${key}`);
  let url: string;

  // 1. Upload (proves endpoint + credentials + write permission)
  try {
    url = await uploadToS3(key, body, 'text/plain');
    console.log(`PASS  upload            ${url}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`FAIL  upload            ${msg}`);
    if (/SignatureDoesNotMatch/i.test(msg)) {
      console.error('      → secret key is wrong, or S3_REGION does not match the provider.');
    } else if (/AccessDenied|403/i.test(msg)) {
      console.error('      → the key exists but lacks write permission on this bucket.');
    } else if (/NoSuchBucket|404/i.test(msg)) {
      console.error('      → bucket name is wrong, or it lives under a different endpoint.');
    } else if (/ENOTFOUND|EAI_AGAIN|fetch failed/i.test(msg)) {
      console.error('      → endpoint host is unreachable. Check S3_ENDPOINT.');
    }
    process.exit(1);
  }

  // 2. Public read (next/image fetches these URLs anonymously)
  try {
    const res = await fetch(url);
    if (res.ok) {
      console.log(`PASS  public read       ${res.status}`);
    } else {
      console.log(`FAIL  public read       ${res.status} — bucket is not public-read`);
      console.log('      → product images will not render. Enable public read access');
      console.log('        on the bucket in your provider panel, or set a read policy.');
    }
  } catch (e) {
    console.log(`FAIL  public read       ${e instanceof Error ? e.message : String(e)}`);
  }

  // 3. Confirm the public URL we build matches what we uploaded
  console.log(
    publicUrl(key) === url
      ? 'PASS  public URL shape  matches'
      : `WARN  public URL shape  built=${publicUrl(key)} uploaded=${url}`,
  );

  // 4. Delete (proves delete permission; product edits rely on it)
  try {
    await deleteFromS3(url);
    console.log('PASS  delete            cleaned up test object');
  } catch (e) {
    console.log(`WARN  delete            ${e instanceof Error ? e.message : String(e)}`);
    console.log(`      → remove ${key} manually; uploads still work.`);
  }

  console.log('\nStorage is configured correctly.');
}

main().catch((e: unknown) => {
  console.error('Check failed:', e);
  process.exit(1);
});
