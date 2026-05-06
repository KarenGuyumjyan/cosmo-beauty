import type { CartItem, Product } from './types';
import { maxOrderQuantity } from './max-order-quantity';

/** Replace cart line products with catalog rows from DB; cap quantity to available stock. */
export function mergeCartWithCatalog(items: CartItem[], catalog: Product[]): CartItem[] {
  const map = new Map(catalog.map((p) => [p.id, p]));
  return items.map((item) => {
    const p = map.get(item.product.id);
    if (!p) return item;
    const max = maxOrderQuantity(p);
    // If stock was previously 0 (quantity clamped to 0) but is now available again, restore to 1.
    const qty = item.quantity === 0 && max > 0 ? 1 : Math.min(item.quantity, max);
    return { product: p, quantity: qty };
  });
}
