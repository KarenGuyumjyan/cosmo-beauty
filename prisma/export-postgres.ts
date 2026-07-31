/**
 * PHASE 1 of the Postgres -> MySQL data migration.
 *
 * Dumps every table from the OLD PostgreSQL database into a single JSON file
 * (`prisma/data-export.json`), which `import-mysql.ts` then loads into MySQL.
 *
 * Uses the raw `pg` driver rather than Prisma Client on purpose: the generated
 * client now targets MySQL and cannot talk to Postgres, and raw `SELECT *`
 * keeps this working no matter which migrations the old database had applied
 * (e.g. before the Category table or the cdekStatus column existed).
 *
 * Usage:
 *   POSTGRES_EXPORT_URL="postgresql://user:pass@host:5432/db" npx tsx prisma/export-postgres.ts
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Client } from 'pg';

const OUT_FILE = join(process.cwd(), 'prisma', 'data-export.json');

// Ordered parent -> child so the import can insert without violating FKs.
const TABLES = [
  'Category',
  'Product',
  'Order',
  'OrderItem',
  'ContactApplication',
  'AdminUser',
] as const;

async function tableExists(client: Client, table: string): Promise<boolean> {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_schema = current_schema() AND table_name = $1
     ) AS present`,
    [table],
  );
  return Boolean(res.rows[0]?.present);
}

async function main() {
  const url = process.env.POSTGRES_EXPORT_URL;
  if (!url) {
    console.error(
      'POSTGRES_EXPORT_URL is not set.\n' +
        'Point it at the OLD Postgres database, e.g.\n' +
        '  POSTGRES_EXPORT_URL="postgresql://user:pass@host:5432/db" npx tsx prisma/export-postgres.ts',
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    // Managed Postgres (Prisma Data Platform, Supabase, Neon…) requires TLS but
    // often presents a cert this client has no CA for.
    ssl: url.includes('localhost') || url.includes('127.0.0.1')
      ? undefined
      : { rejectUnauthorized: false },
  });

  await client.connect();
  console.log('Connected to source Postgres.');

  const data: Record<string, unknown[]> = {};
  const missing: string[] = [];

  for (const table of TABLES) {
    if (!(await tableExists(client, table))) {
      missing.push(table);
      data[table] = [];
      continue;
    }
    // Quoted identifier: these tables are CamelCase in Postgres.
    const res = await client.query(`SELECT * FROM "${table}"`);
    data[table] = res.rows;
    console.log(`  ${table.padEnd(20)} ${res.rows.length} rows`);
  }

  await client.end();

  if (missing.length) {
    console.log(
      `\nNote: these tables did not exist in the source DB and were exported empty: ${missing.join(', ')}.`,
    );
    if (missing.includes('Category')) {
      console.log(
        'Categories will be rebuilt on import from the canonical list plus any ' +
          'category values found on products.',
      );
    }
  }

  const payload = {
    exportedFrom: 'postgresql',
    // Stamped by the caller's clock, informational only.
    exportedAt: new Date().toISOString(),
    tables: data,
  };

  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf8');

  const total = Object.values(data).reduce((n, rows) => n + rows.length, 0);
  console.log(`\nWrote ${total} rows across ${TABLES.length} tables to ${OUT_FILE}`);
  console.log('Next: point DATABASE_URL at MySQL and run `npm run db:import`.');
}

main().catch((e: unknown) => {
  console.error('Export failed:', e);
  process.exit(1);
});
