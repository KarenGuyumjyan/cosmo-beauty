# Object storage (S3-compatible)

Product images and videos are stored in **S3-compatible object storage**
(reg.ru, Yandex Object Storage, Selectel, MinIO…), replacing Vercel Blob.

The implementation is provider-agnostic — the endpoint comes from the
environment, so switching providers is a config change, not a code change.

Client: [`aws4fetch`](https://github.com/mhart/aws4fetch) (~80 KB installed,
zero dependencies) rather than the AWS SDK (~2–3 MB), since all we need is
signed PUT/DELETE.

---

## 1. Environment variables

```bash
S3_ENDPOINT="https://s3.example-provider.ru"   # bucket NOT included in the host
S3_BUCKET="cosmo-media"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."

# optional
S3_REGION="ru-1"                    # default: ru-1
S3_PUBLIC_URL="https://cdn.your-domain.ru"   # if served via CDN/custom domain
```

Get the endpoint, region and keys from your provider's control panel. If
`S3_PUBLIC_URL` is unset, files are served from `${S3_ENDPOINT}/${S3_BUCKET}/…`.

**The bucket must allow public reads** — `next/image` fetches the files
directly. Objects are uploaded with `x-amz-acl: public-read`; if your provider
ignores per-object ACLs, set a public-read bucket policy in its panel instead.

No app restart is needed for `next.config.ts` to pick up the host: the allowed
image host is derived from `S3_PUBLIC_URL`/`S3_ENDPOINT` at build time, so
**rebuild** after changing either.

---

## 2. Moving existing media off Vercel Blob

`npm run media:migrate` downloads every product image/video still hosted
elsewhere, uploads it to S3, and rewrites the URL in the database.

```bash
npm run media:migrate -- --dry-run   # report what would move, change nothing
npm run media:migrate                # do it
```

Properties worth knowing:

- **Idempotent** — files already in your bucket are skipped, so re-running is
  safe and is how you retry failures.
- **All-or-nothing per product** — a product's row is updated only after all of
  its files transferred. A partial failure leaves that product untouched rather
  than half-migrated.
- **Deduplicated** — the same photo reused across products uploads once.
- Exits non-zero if any file failed, and lists them.

The Vercel Blob host has already been **removed** from `next.config.ts`
`remotePatterns`, so `next/image` will refuse any leftover Blob URL with
`Invalid src prop … hostname is not configured`.

That means the migration must be run against **every** database before
deploying — including production. To check a database is clean:

```bash
DATABASE_URL='mysql://…' npm run media:migrate -- --dry-run   # expect 0 files
```

If you ever need a transitional period where both hosts render, temporarily
re-add:

```ts
{ protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
```

---

## 3. How it's wired

| Concern | Location |
|---|---|
| Upload / delete / URL helpers | `lib/s3.ts` |
| Admin upload endpoint | `app/api/upload/route.ts` (`POST /api/upload`) |
| Delete on product edit/remove | `app/admin/_actions/products.ts` |
| Bulk upload from a folder | `scripts/bulk-upload.ts` |
| One-time media migration | `scripts/migrate-media-to-s3.ts` |
| Allowed image hosts | `next.config.ts` (derived from env) |

### Object keys

`buildObjectKey()` produces `uploads/<slugified-name>-<21 hex chars><.ext>`:

- Cyrillic is **transliterated**, not stripped — `Спонж 2 color.JPG` becomes
  `sponzh-2-color-a1b2….jpg`, so filenames stay meaningful.
- Keys are restricted to characters needing no URL escaping, which keeps the
  signed request and the public URL byte-identical (a common source of
  `SignatureDoesNotMatch`).
- The random suffix makes every URL immutable, so files are served with
  `Cache-Control: public, max-age=31536000, immutable`.

### Deleting

`deleteFromS3()` returns `false` for URLs outside your bucket instead of
throwing, so a mixed set of legacy and current URLs can be cleaned up without
special-casing.

---

## 4. Troubleshooting

| Symptom | Cause |
|---|---|
| `Storage is not configured` on upload | One of the four required vars is missing |
| `SignatureDoesNotMatch` | Wrong secret key, or wrong `S3_REGION` for the provider |
| `403` on upload | Key lacks write permission on the bucket |
| Images 403 in the browser | Bucket isn't public-read |
| `Invalid src prop … hostname not configured` | Rebuild after changing `S3_ENDPOINT`/`S3_PUBLIC_URL` |
| Upload works, image won't render | `S3_PUBLIC_URL` doesn't match how the bucket is actually served |
