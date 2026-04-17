import type { Product } from './types';

/** Max units per line; legacy cart JSON may omit stockQuantity — avoid NaN in Math.min. */
export function maxOrderQuantity(product: Pick<Product, 'stockQuantity'>): number {
  const n = product.stockQuantity;
  if (typeof n === 'number' && Number.isFinite(n) && n >= 0) return n;
  return Number.MAX_SAFE_INTEGER;
}
