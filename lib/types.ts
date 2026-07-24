export interface LocalizedString {
  en: string;
  hy: string;
  ru: string;
}

export type Locale = 'en' | 'hy' | 'ru';

// Category slug (underscore format, e.g. "blush"). Categories are now stored in
// the DB (see the Category model / lib/categories.ts), so this is an open string
// rather than a fixed union.
export type Category = string;

export interface Product {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  shortDescription: LocalizedString;
  price: number;
  discountedPrice?: number;
  images: string[];
  videos: string[];
  category: Category;
  size: string;
  sku: string;
  stockQuantity: number;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  includedItems?: LocalizedString[];
  featured?: boolean;
  bestseller?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  totalItems: number;
  subtotal: number;
}

export type SortOption = 'priceAsc' | 'priceDesc' | 'newest' | 'popular';

export interface CategoryOption {
  value: Category;
  label: LocalizedString;
}
