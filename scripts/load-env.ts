/**
 * Load `.env` into process.env for standalone scripts.
 *
 * Next.js loads `.env` for the app, and Prisma Client loads it as a side effect
 * for the DB scripts — but a script that imports neither (e.g. check-s3.ts,
 * bulk-upload.ts) would otherwise see no variables at all.
 *
 * Import this FIRST, before anything that reads process.env:
 *   import './load-env';
 *
 * Deliberately dependency-free and non-destructive: variables already present
 * in the environment win, so `FOO=bar npx tsx script.ts` still overrides .env.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function parseEnvFile(contents: string): Record<string, string> {
  const out: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const eq = line.indexOf('=');
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!key) continue;

    let value = line.slice(eq + 1).trim();

    // Strip matching surrounding quotes; only unquoted values take a trailing comment.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    } else {
      const hash = value.indexOf(' #');
      if (hash !== -1) value = value.slice(0, hash).trim();
    }

    out[key] = value;
  }

  return out;
}

export function loadEnv(file = '.env'): void {
  const path = join(process.cwd(), file);
  if (!existsSync(path)) return;

  for (const [key, value] of Object.entries(parseEnvFile(readFileSync(path, 'utf8')))) {
    // Real environment variables take precedence over the file.
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv();
