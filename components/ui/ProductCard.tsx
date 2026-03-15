'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ShoppingBag, Heart, Star } from 'lucide-react';
import { Product, Locale } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  locale: Locale;
}

export default function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations('catalog');
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const name = product.name[locale];
  const price = product.discountedPrice ?? product.price;
  const hasDiscount = !!product.discountedPrice;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!product.inStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link href={`/product/${product.id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-rose-200 hover:shadow-xl hover:shadow-rose-100/50 transition-all duration-300">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-stone-50">
          <Image
            src={product.images[0]}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 280px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badges */}
          <div className="absolute top-1.5 left-1.5 md:top-3 md:left-3 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-rose-600 text-white text-[10px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full">
                -{discountPercent}%
              </span>
            )}
            {product.bestseller && (
              <span className="bg-amber-400 text-amber-900 text-[10px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full flex items-center gap-0.5 md:gap-1">
                <Star size={8} fill="currentColor" className="md:hidden" />
                <Star size={10} fill="currentColor" className="hidden md:block" />
                Best
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); setWishlisted(!wishlisted); }}
            className="absolute top-1.5 right-1.5 md:top-3 md:right-3 w-6 h-6 md:w-8 md:h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-white"
            aria-label="Add to wishlist"
          >
            <Heart
              size={12}
              className={wishlisted ? 'fill-rose-500 text-rose-500' : 'text-stone-400'}
            />
          </button>

          {/* Out of stock overlay */}
          {!product.inStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="text-stone-500 font-medium text-xs md:text-sm">{t('outOfStock')}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2 md:p-4">
          <p className="text-[10px] md:text-xs text-rose-500 font-medium uppercase tracking-wider mb-0.5 md:mb-1 capitalize">
            {product.category}
          </p>
          <h3 className="text-stone-800 font-semibold text-xs md:text-sm leading-tight line-clamp-2 mb-2 md:mb-3 group-hover:text-rose-700 transition-colors">
            {name}
          </h3>

          {/* Price + CTA */}
          <div className="flex items-center justify-between gap-1 md:gap-2">
            <div className="flex flex-col">
              <span className="text-rose-700 font-bold text-sm md:text-base">
                {price.toLocaleString()} AMD
              </span>
              {hasDiscount && (
                <span className="text-stone-400 text-[10px] md:text-xs line-through">
                  {product.price.toLocaleString()} AMD
                </span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`shrink-0 flex items-center justify-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-semibold w-7 h-7 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-full transition-all duration-200 ${
                added
                  ? 'bg-green-500 text-white scale-95'
                  : product.inStock
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              <ShoppingBag size={12} className="md:hidden" />
              <ShoppingBag size={13} className="hidden md:block" />
              <span className="hidden md:inline">{added ? t('added') : t('addToCart')}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
