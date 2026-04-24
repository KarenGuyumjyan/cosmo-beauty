'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import { maxOrderQuantity } from '@/lib/max-order-quantity';
import { CartItem, CartState, Product } from '@/lib/types';
import { mergeCartWithCatalog } from '@/lib/cart-merge-catalog';

type CartAction =
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' }
  | { type: 'HYDRATE'; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.items;
    case 'ADD_ITEM': {
      const existing = state.find((item) => item.product.id === action.product.id);
      if (existing) {
        const max = maxOrderQuantity(action.product);
        if (existing.quantity >= max) return state;
        return state.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, max) }
            : item
        );
      }
      return [...state, { product: action.product, quantity: 1 }];
    }
    case 'REMOVE_ITEM':
      return state.filter((item) => item.product.id !== action.productId);
    case 'UPDATE_QUANTITY':
      if (action.quantity <= 0) {
        return state.filter((item) => item.product.id !== action.productId);
      }
      return state.map((item) => {
        if (item.product.id !== action.productId) return item;
        const max = maxOrderQuantity(item.product);
        return { ...item, quantity: Math.min(action.quantity, max) };
      });
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('cosmo-cart');
    return stored ? (JSON.parse(stored) as CartItem[]) : [];
  } catch {
    return [];
  }
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Always start empty so SSR + first client paint match; hydrate from localStorage in useLayoutEffect.
  const [items, dispatch] = useReducer(cartReducer, [] as CartItem[]);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const canPersist = useRef(false);

  const idsKey = useMemo(
    () => [...new Set(items.map((i) => i.product.id))].sort().join(','),
    [items]
  );

  useLayoutEffect(() => {
    dispatch({ type: 'HYDRATE', items: loadCartFromStorage() });
    canPersist.current = true;
  }, []);

  useEffect(() => {
    if (!canPersist.current) return;
    localStorage.setItem('cosmo-cart', JSON.stringify(items));
  }, [items]);

  // When cart line product ids change, merge lines with PostgreSQL (prices, stock, fields).
  useEffect(() => {
    if (!idsKey) return;
    const ids = idsKey.split(',').filter(Boolean);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch('/api/cart-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids }),
        });
        if (!res.ok || cancelled) return;
        const catalog = (await res.json()) as Product[];
        if (cancelled) return;
        const merged = mergeCartWithCatalog(itemsRef.current, catalog);
        dispatch({ type: 'HYDRATE', items: merged });
      } catch {
        /* offline or DB unavailable — keep local cart */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) =>
      sum + (item.product.discountedPrice ?? item.product.price) * item.quantity,
    0
  );

  const value: CartState = {
    items,
    addItem: (product: Product) => dispatch({ type: 'ADD_ITEM', product }),
    removeItem: (productId: string) => dispatch({ type: 'REMOVE_ITEM', productId }),
    updateQuantity: (productId: string, quantity: number) =>
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity }),
    clearCart: () => dispatch({ type: 'CLEAR_CART' }),
    totalItems,
    subtotal,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
