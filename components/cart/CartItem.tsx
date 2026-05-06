'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem as CartItemType, Locale } from '@/lib/types';
import { getCategoryLabel } from '@/lib/data';
import { maxOrderQuantity } from '@/lib/max-order-quantity';
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
  const maxQty = maxOrderQuantity(product);
  const isOutOfStock = product.stockQuantity === 0;
  const isMin = quantity <= 1;
  const isMax = quantity >= maxQty;

  return (
    <div className={`flex gap-4 py-5 border-b border-stone-100 last:border-0 animate-fade-in ${isOutOfStock ? 'opacity-60' : ''}`}>
      {/* Image */}
      <div className="shrink-0 flex flex-col items-center">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-50">
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="96px"
            className={`object-cover ${isOutOfStock ? 'grayscale' : ''}`}
          />
          {isOutOfStock && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <span className="text-[10px] font-semibold text-stone-500 text-center leading-tight px-1">
                {t('outOfStock')}
              </span>
            </div>
          )}
        </div>
        {!isOutOfStock && (
          <span className="font-bold text-sm mt-2 md:hidden">
            {(price * quantity).toLocaleString()} ₽
          </span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="md:flex md:justify-between md:items-start">
          <div>
            <p className="text-xs text-rose-500 font-medium uppercase tracking-wide capitalize mb-0.5">
              {getCategoryLabel(product.category, locale)}
            </p>
            <h3 className="font-semibold text-stone-800 text-sm leading-snug mb-1">{name}</h3>
            <p className="text-xs text-stone-400">
              {t('size')}: <span className="text-stone-600 font-medium">{product.size}</span>
              {' · '}SKU: {product.sku}
            </p>
            {isOutOfStock && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 rounded-full px-2.5 py-0.5">
                {t('outOfStock')}
              </span>
            )}
          </div>
          {!isOutOfStock && (
            <span className="hidden md:block font-bold text-base whitespace-nowrap ml-4">
              {(price * quantity).toLocaleString()} ₽
            </span>
          )}
        </div>

        {/* Quantity controls / remove */}
        <div className="flex items-center justify-between md:justify-start md:gap-2 mt-2">
          {!isOutOfStock ? (
            <div className="flex items-center gap-0.5 border border-stone-200 rounded-full overflow-hidden">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                disabled={isMin}
                className="w-7 h-7 flex items-center justify-center transition-colors text-stone-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Minus size={12} />
              </button>
              <span className="w-7 text-center text-xs font-semibold text-stone-800">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={isMax}
                className="w-7 h-7 flex items-center justify-center transition-colors text-stone-600 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:pointer-events-none"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <div />
          )}

          <button
            onClick={() => removeItem(product.id)}
            className="w-7 h-7 rounded-full flex items-center justify-center text-stone-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label={t('remove')}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
