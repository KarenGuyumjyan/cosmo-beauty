# PostgreSQL → MySQL/MariaDB migration

The app now runs on **MySQL/MariaDB** (`provider = "mysql"`). This document
covers what changed and how to move a live database over.

Verified against **MariaDB 10.11**; also compatible with MySQL 8.

---

## 1. What changed

| Area | Before (Postgres) | After (MySQL/MariaDB) |
| --- | --- | --- |
| `Product.images` / `videos` | `String[]` (`text[]`) | `Json` (JSON array of URLs) |
| `Product.category` | `ProductCategory` enum | `String` slug + FK to `Category` |
| Long text columns | unlimited `TEXT` | explicit `@db.Text` / `@db.VarChar(n)` |
| `datasource` | `postgresql` + `directUrl` | `mysql`, single `url` |
| Migrations | 6 Postgres migrations | one MariaDB baseline (`init_mysql`) |

### Column sizing — why it matters

On Postgres a bare `String` is unlimited `TEXT`. On MySQL it becomes
`VARCHAR(191)`, which would **silently truncate** existing content — product
`shortDesc` values already reach 176 characters, and contact messages are far
longer. So free-form fields are now `@db.Text` and human-entered fields are
widened to `VarChar(255)`/`VarChar(500)`.

Indexed columns (`@id`, `@unique`) stay at the 191 default so they fit MySQL's
utf8mb4 index-length limit.

### Reading the JSON array columns

MySQL has no scalar list type, so `images`/`videos` are JSON. Always read them
through the helper — never index the raw Prisma value:

```ts
import { jsonToStringArray, firstJsonString } from '@/lib/json-array';

const urls  = jsonToStringArray(product.images); // string[]
const cover = firstJsonString(product.images);   // string | null
```

Writing takes a plain array (the old `{ set: [...] }` scalar-list syntax is
**not** valid for `Json` fields):

```ts
await prisma.product.update({ where: { id }, data: { images: ['a.jpg'] } });
```

`lib/db-products.ts` already normalizes these, so anything using the app-level
`Product` type keeps getting a real `string[]`.

---

## 2. Environment

Replace the Postgres URL in `.env`:

```bash
# Before
# DATABASE_URL="postgresql://…"

# After
DATABASE_URL="mysql://user:password@host:3306/dbname"
```

### Local development (macOS, Homebrew)

MariaDB runs as a normal background service — no Docker required.

```bash
brew install mariadb
brew services start mariadb        # also restarts at login

# One-time: create the database and an app user.
# utf8mb4 is required, or Cyrillic/Armenian text corrupts.
mariadb -e "
  CREATE DATABASE IF NOT EXISTS cosmo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'cosmo'@'127.0.0.1' IDENTIFIED BY 'cosmopw';
  GRANT ALL PRIVILEGES ON cosmo.* TO 'cosmo'@'127.0.0.1';
  FLUSH PRIVILEGES;"
```

```bash
# .env
DATABASE_URL="mysql://cosmo:cosmopw@127.0.0.1:3306/cosmo"
```

```bash
npx prisma migrate deploy
npm run seed
npm run db:verify
```

Managing the service:

```bash
brew services start mariadb     # start (and enable at login)
brew services stop mariadb      # stop
brew services list              # status
```

Note: `root` uses unix-socket auth, so `mariadb -uroot` fails; connect as your
own OS user (`mariadb`) for admin work, and let the app use the `cosmo` user
over TCP.

If you prefer a container instead, any MySQL 8 / MariaDB 10.5+ image works —
just point `DATABASE_URL` at it. Nothing in the project depends on Docker.

---

## 3. Setting up a fresh database

```bash
npx prisma migrate deploy   # create the schema
npm run seed                # categories + products + admin user
npm run db:verify           # confirm everything works
```

Create the database with utf8mb4 so Cyrillic/Armenian text is stored correctly:

```sql
CREATE DATABASE cosmo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 4. Moving live data from the old Postgres

Two phases, so the two databases never need to be reachable from the same
Prisma Client.

### Phase 1 — export from Postgres

```bash
POSTGRES_EXPORT_URL="postgresql://user:pass@old-host:5432/db" npm run db:export
```

Writes `prisma/data-export.json`. It reads with raw SQL (`SELECT *`), so it
works regardless of which migrations the old database had applied — including
older states with no `Category` table and `category` still an enum.

> **This file contains customer PII** (names, phones, emails, addresses).
> It is gitignored. Delete it once the migration is done.

### Phase 2 — import into MySQL

```bash
DATABASE_URL="mysql://user:pass@new-host:3306/db" npm run db:import
npm run db:verify
```

The import:

- converts `text[]` → JSON arrays (preserving order, so `images[0]` stays the
  main image),
- rebuilds the `Category` table from the dump, the canonical list, and any
  category referenced by a product, so no product can fail its foreign key,
- defaults columns the old database never had (`cdekStatus`, shipping
  dimensions) to null,
- **upserts by primary key, so it is safe to re-run**,
- skips (and reports) order items whose order or product is missing, rather
  than aborting the whole import.

### Recommended cutover

1. Put the site in maintenance / stop writes.
2. `npm run db:export` against production Postgres.
3. `npx prisma migrate deploy` against the new MySQL.
4. `npm run db:import`, then `npm run db:verify`.
5. Point `DATABASE_URL` at MySQL and deploy.
6. Delete `prisma/data-export.json`.
7. Keep the Postgres database read-only for a while as a rollback path.

---

## 5. Verification

```bash
npm run db:verify
```

Exits non-zero on failure, so it can gate a deploy. It checks connectivity and
server version, utf8mb4 charset, row counts, that `images`/`videos` parse as
string arrays with order preserved, foreign keys exist and are enforced, all
tables are InnoDB, every product category resolves, order→items→product joins,
`OrderStatus` enum round-trip, `groupBy`/`aggregate`, Cyrillic and Armenian
text integrity, SKU uniqueness, and a full JSON write/read round-trip.

---

## 6. Behaviour differences to be aware of

- **Case sensitivity.** MySQL's default collation (`utf8mb4_unicode_ci`) is
  case-**insensitive**; Postgres was case-sensitive. Text searches and
  `startsWith` are now case-insensitive (generally an improvement for catalog
  search), but `@unique` columns also become case-insensitive — `A@b.com` and
  `a@b.com` can no longer coexist as two admin emails.
- **MariaDB JSON is LONGTEXT.** MariaDB implements `JSON` as an alias for
  `LONGTEXT` with a validity check, so `information_schema` reports `longtext`.
  This is expected and works correctly with Prisma.
- **No JSON column defaults.** MariaDB cannot default a JSON/LONGTEXT column,
  which is why `images`/`videos` are required and every create sets them.

---

## 7. Cleanup after migrating

- Delete `prisma/data-export.json`.
- `npm uninstall -D pg @types/pg` — only the one-time export script needs them.
- `prisma/legacy/postgres-migrations/` is kept for reference and is never run
  by Prisma; delete it whenever you like.
