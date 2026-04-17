import type { CartItem, Product } from './types';
import { maxOrderQuantity } from './max-order-quantity';

/** Replace cart line products with catalog rows from DB; cap quantity to available stock. */
export function mergeCartWithCatalog(items: CartItem[], catalog: Product[]): CartItem[] {
  const map = new Map(catalog.map((p) => [p.id, p]));
  return items.map((item) => {
    const p = map.get(item.product.id);
    if (!p) return item;
    const max = maxOrderQuantity(p);
    return { product: p, quantity: Math.min(item.quantity, max) };
  });
}
