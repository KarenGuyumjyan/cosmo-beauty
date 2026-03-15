export interface LocalizedString {
  en: string;
  hy: string;
  ru: string;
}

export type Locale = 'en' | 'hy' | 'ru';

export type Category =
  | 'cosmetic-sponges'
  | 'lip-liner'
  | 'blush'
  | 'stick'
  | 'lip-gloss'
  | 'highlighter'
  | 'concealer';

export interface Product {
  id: string;
  slug: string;
  name: LocalizedString;
  description: LocalizedString;
  shortDescription: LocalizedString;
  price: number;
  discountedPrice?: number;
  images: string[];
  category: Category;
  size: string;
  sku: string;
  inStock: boolean;
  includedItems?: LocalizedString[];
  featured?: boolean;
  bestseller?: boolean;
  tags?: string[];
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
  totalItems: number;
  subtotal: number;
}

export type SortOption = 'priceAsc' | 'priceDesc' | 'newest' | 'popular';
