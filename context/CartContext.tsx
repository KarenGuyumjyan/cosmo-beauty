'use client';

import React, { createContext, useContext, useState, useEffect, useReducer } from 'react';
import { CartItem, CartState, Product } from '@/lib/types';

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
        return state.map((item) =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
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
      return state.map((item) =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
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
  const [items, dispatch] = useReducer(cartReducer, []);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = loadCartFromStorage();
    if (stored.length > 0) {
      dispatch({ type: 'HYDRATE', items: stored });
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem('cosmo-cart', JSON.stringify(items));
    }
  }, [items, hydrated]);

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
