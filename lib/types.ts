export interface LocalizedString {
  en: string;
  hy: string;
  ru: string;
}

export type Locale = 'en' | 'hy' | 'ru';

// Underscore format — must match Prisma enum ProductCategory values
export type Category =
  | 'cosmetic_sponges'
  | 'lip_liner'
  | 'blush'
  | 'stick'
  | 'lip_gloss'
  | 'highlighter'
  | 'concealer'
  | 'eyeshadow_palette'
  | 'setting_spray'
  | 'false_eyelashes';

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
  inStock: boolean;
  stockQuantity: number;
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
  totalItems: number;
  subtotal: number;
}

export type SortOption = 'priceAsc' | 'priceDesc' | 'newest' | 'popular';

export interface CategoryOption {
  value: Category;
  label: LocalizedString;
}
