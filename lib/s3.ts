import { AwsClient } from 'aws4fetch';

/**
 * S3-compatible object storage (reg.ru, Yandex Object Storage, Selectel, MinIO…).
 *
 * Deliberately provider-agnostic: the endpoint comes from the environment, so
 * switching providers is a config change rather than a code change. Replaces
 * Vercel Blob, which is unavailable/unreliable for the Russian audience.
 *
 * Required env:
 *   S3_ENDPOINT      e.g. https://s3.regru.cloud   (no bucket in the host)
 *   S3_BUCKET        bucket name
 *   S3_ACCESS_KEY_ID
 *   S3_SECRET_ACCESS_KEY
 * Optional:
 *   S3_REGION        default "ru-1"
 *   S3_PUBLIC_URL    public base URL if files are served from a CDN/custom
 *                    domain. Defaults to `${S3_ENDPOINT}/${S3_BUCKET}`.
 */

function env(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) {
    throw new Error(
      `${name} is not configured. Set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY in .env.`,
    );
  }
  return v;
}

/** Endpoint without a trailing slash. */
function endpoint(): string {
  return env('S3_ENDPOINT').replace(/\/+$/, '');
}

function bucket(): string {
  return env('S3_BUCKET');
}

let cachedClient: AwsClient | null = null;

function client(): AwsClient {
  if (!cachedClient) {
    cachedClient = new AwsClient({
      accessKeyId: env('S3_ACCESS_KEY_ID'),
      secretAccessKey: env('S3_SECRET_ACCESS_KEY'),
      region: process.env.S3_REGION?.trim() || 'ru-1',
      service: 's3',
    });
  }
  return cachedClient;
}

/** Internal URL used to sign requests (path-style: endpoint/bucket/key). */
function objectUrl(key: string): string {
  return `${endpoint()}/${bucket()}/${encodeKey(key)}`;
}

/** Public URL stored in the database and rendered by next/image. */
export function publicUrl(key: string): string {
  const base = process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, '');
  return base
    ? `${base}/${encodeKey(key)}`
    : `${endpoint()}/${bucket()}/${encodeKey(key)}`;
}

/** Percent-encode each path segment but keep the slashes that build the key. */
function encodeKey(key: string): string {
  return key.split('/').map(encodeURIComponent).join('/');
}

/** True when the storage env vars are present (used to fail fast with a clear message). */
export function isS3Configured(): boolean {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY_ID &&
      process.env.S3_SECRET_ACCESS_KEY,
  );
}

// Cyrillic -> Latin for object keys. Most uploads here have Russian filenames,
// and stripping non-ASCII would collapse them all to near-identical keys.
// (lib/cdek/translit.ts maps the opposite direction and isn't reusable here.)
const RU_TO_LAT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
};

function transliterateForKey(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => RU_TO_LAT[ch] ?? ch)
    .join('');
}

/**
 * Build a collision-safe object key from a filename.
 * Mirrors Vercel Blob's `addRandomSuffix`: keeps the original name readable
 * while guaranteeing uniqueness. Cyrillic is transliterated (not stripped) and
 * the result is restricted to characters that need no URL escaping, which also
 * keeps the signed request and the public URL byte-identical.
 */
export function buildObjectKey(filename: string, prefix = 'uploads'): string {
  const dot = filename.lastIndexOf('.');
  const rawName = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot).toLowerCase() : '';

  const safeName =
    transliterateForKey(rawName)
      .normalize('NFKD')
      .replace(/[^\w.-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'file';

  // 21 hex chars of randomness - same collision profile as Vercel's suffix.
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(11)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 21);

  return `${prefix}/${safeName}-${suffix}${ext}`;
}

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
};

export function contentTypeFor(filename: string): string {
  const dot = filename.lastIndexOf('.');
  const ext = dot > 0 ? filename.slice(dot).toLowerCase() : '';
  return CONTENT_TYPES[ext] ?? 'application/octet-stream';
}

/**
 * Upload a file and return its public URL.
 * Objects are written with `public-read` so next/image can fetch them directly.
 */
export async function uploadToS3(
  key: string,
  body: ArrayBuffer | Uint8Array | Blob,
  contentType: string,
): Promise<string> {
  const res = await client().fetch(objectUrl(key), {
    method: 'PUT',
    body: body as BodyInit,
    headers: {
      'Content-Type': contentType,
      'x-amz-acl': 'public-read',
      // Immutable: keys always carry a random suffix, so a URL never changes content.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`S3 upload failed (${res.status}) for ${key}: ${text.slice(0, 300)}`);
  }

  return publicUrl(key);
}

/**
 * Delete an object by its public URL (what the database stores).
 * Returns false for URLs that don't belong to this bucket, so callers can pass
 * a mixed set (e.g. externally hosted images) without special-casing.
 */
export async function deleteFromS3(url: string): Promise<boolean> {
  const key = keyFromPublicUrl(url);
  if (!key) return false;

  const res = await client().fetch(objectUrl(key), { method: 'DELETE' });
  // S3 returns 204 on success and on a key that never existed.
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`S3 delete failed (${res.status}) for ${key}: ${text.slice(0, 300)}`);
  }
  return true;
}

/** Extract the object key from one of our public URLs, or null if foreign. */
export function keyFromPublicUrl(url: string): string | null {
  const candidates = [
    process.env.S3_PUBLIC_URL?.trim().replace(/\/+$/, ''),
    `${process.env.S3_ENDPOINT?.trim().replace(/\/+$/, '')}/${process.env.S3_BUCKET?.trim()}`,
  ].filter((b): b is string => typeof b === 'string' && b.length > 0 && !b.includes('undefined'));

  for (const base of candidates) {
    if (url.startsWith(`${base}/`)) {
      return decodeURIComponent(url.slice(base.length + 1));
    }
  }
  return null;
}
