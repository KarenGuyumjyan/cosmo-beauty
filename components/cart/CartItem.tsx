'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType, Locale } from '@/lib/types';
import { getCategoryLabel } from '@/lib/data';
import { useCart } from '@/context/CartContext';

interface CartItemProps {
  item: CartItemType;
  locale: Locale;
}

export default function CartItem({ item, locale }: CartItemProps) {
  const t = useTranslations('cart');
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;
  const name = product.name[locale];
  const price = product.discountedPrice ?? product.price;

  return (
    <div className="flex gap-4 py-5 border-b border-stone-100 last:border-0 animate-fade-in">
      {/* Image */}
      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-50 shrink-0">
        <Image
          src={product.images[0]}
          alt={name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-rose-500 font-medium uppercase tracking-wide capitalize mb-0.5">
          {getCategoryLabel(product.category, locale)}
        </p>
        <h3 className="font-semibold text-stone-800 text-sm leading-snug mb-1">{name}</h3>
        <p className="text-xs text-stone-400">
          {t('size')}: <span className="text-stone-600 font-medium">{product.size}</span>
          {' · '}SKU: {product.sku}
        </p>

        {/* Quantity controls + price */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1 border border-stone-200 rounded-full overflow-hidden">
            <button
              onClick={() => updateQuantity(product.id, quantity - 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors text-stone-600"
            >
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-sm font-semibold text-stone-800">{quantity}</span>
            <button
              onClick={() => updateQuantity(product.id, quantity + 1)}
              className="w-8 h-8 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors text-stone-600"
            >
              <Plus size={13} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-bold text-rose-700 text-sm">
              {(price * quantity).toLocaleString()} AMD
            </span>
            <button
              onClick={() => removeItem(product.id)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={t('remove')}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
