/**
 * Helpers for the `Json` columns that hold ordered string arrays
 * (`Product.images`, `Product.videos`).
 *
 * MySQL/MariaDB has no scalar list type, so what was `String[]` on Postgres is
 * now a JSON array. Prisma types these as `JsonValue`, so every read goes
 * through `jsonToStringArray` to get a plain, safely-typed `string[]`.
 */

/**
 * Coerce a Prisma `Json` value into `string[]`.
 *
 * Tolerates every shape the column can realistically hold: a proper array, a
 * double-encoded JSON string (MariaDB stores JSON as LONGTEXT, so a legacy or
 * hand-written row can be a string), or null/garbage — all yield a safe array.
 * Non-string entries are dropped rather than rendered as "[object Object]".
 */
export function jsonToStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      return jsonToStringArray(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

/** First entry of a JSON string array (e.g. a product's main image), or null. */
export function firstJsonString(value: unknown): string | null {
  return jsonToStringArray(value)[0] ?? null;
}
