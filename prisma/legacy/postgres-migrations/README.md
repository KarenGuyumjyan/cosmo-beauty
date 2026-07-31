# Legacy PostgreSQL migrations (archived)

These are the migration files from when this project ran on **PostgreSQL**,
kept for reference only.

They are **not runnable** against MySQL/MariaDB — they use Postgres-only syntax
(`ALTER TYPE ... ADD VALUE`, `TEXT[]`, `DROP TYPE`, `USING` casts). They live
outside `prisma/migrations/` so Prisma never tries to apply them.

The MySQL/MariaDB schema starts from a fresh baseline in
`prisma/migrations/<timestamp>_init_mysql/`.

To move data from the old Postgres database into MySQL, see
`prisma/export-postgres.ts` and `prisma/import-mysql.ts`
(usage documented in `docs/mysql-migration.md`).
