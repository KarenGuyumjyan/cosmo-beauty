'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ShoppingBag, Check, Package, Tag, ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Product, Locale } from '@/lib/types';
import { getCategoryLabel } from '@/lib/data';
import { useCart } from '@/context/CartContext';
import ImageGallery from '@/components/product/ImageGallery';

interface ProductDetailProps {
  product: Product;
  locale: Locale;
}

export default function ProductDetail({ product, locale }: ProductDetailProps) {
  const t = useTranslations('product');
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  const name = product.name[locale];
  const description = product.description[locale];
  const hasDiscount = !!product.discountedPrice;
  const price = product.discountedPrice ?? product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountedPrice!) / product.price) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!product.inStock) return;
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <div className="pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Back link */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-rose-600 transition-colors mb-8 group"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-1 transition-transform" />
          {t('backToCatalog')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-16">
          {/* Gallery */}
          <div>
            <ImageGallery images={product.images} videos={product.videos} altBase={name} />
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-rose-600 text-xs font-semibold capitalize tracking-widest mb-2">
              {getCategoryLabel(product.category, locale)}
            </p>
            <h1
              className="text-3xl sm:text-4xl font-bold text-stone-900 mb-4 leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {name}
            </h1>

            {/* Price */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-3xl font-bold text-rose-700">
                {price.toLocaleString()} ₽
              </span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-stone-400 line-through">
                    {product.price.toLocaleString()} ₽
                  </span>
                  <span className="bg-rose-600 text-white text-sm font-bold px-3 py-1 rounded-full">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Stock + size badge */}
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`flex items-center gap-1.5 text-sm font-medium ${product.inStock ? 'text-green-700' : 'text-stone-500'}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${product.inStock ? 'bg-green-500' : 'bg-stone-300'}`} />
                {product.inStock ? t('inStock') : t('outOfStock')}
              </span>
              <span className="px-3 py-1 bg-stone-100 text-stone-600 text-sm font-medium rounded-full">
                {product.size}
              </span>
            </div>

            {/* Add to cart */}
            <button
              onClick={handleAddToCart}
              disabled={!product.inStock}
              className={`flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold text-base transition-all duration-200 mb-8 ${
                added
                  ? 'bg-rose-950 text-white scale-95'
                  : product.inStock
                  ? 'bg-rose-600 hover:bg-rose-700 active:scale-95 text-white shadow-lg shadow-rose-200'
                  : 'bg-stone-100 text-stone-400 cursor-not-allowed'
              }`}
            >
              {added ? (
                <><Check size={20} /> Added to Cart</>
              ) : (
                <><ShoppingBag size={20} /> {t('addToCart')}</>
              )}
            </button>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 pb-8 border-b border-stone-100 text-sm text-stone-500">
              <span className="flex items-center gap-1.5">
                <Tag size={14} /> {t('sku')}: <strong className="text-stone-700">{product.sku}</strong>
              </span>
              {hasDiscount && (
                <span className="flex items-center gap-1.5 text-green-600 font-medium">
                  {t('save')}: {(product.price - product.discountedPrice!).toLocaleString()} ₽
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-6">
              <h3 className="font-bold text-stone-900 mb-3">{t('description')}</h3>
              <p className="text-stone-600 leading-relaxed text-sm">{description}</p>
            </div>

            {/* What's included */}
            {product.includedItems && product.includedItems.length > 0 && (
              <div className="mt-6 bg-rose-50 rounded-2xl p-5">
                <h3 className="font-bold text-stone-900 mb-3 flex items-center gap-2">
                  <Package size={16} className="text-rose-600" /> {t('includes')}
                </h3>
                <ul className="space-y-2">
                  {product.includedItems.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-600">
                      <Check size={14} className="text-green-500 shrink-0" />
                      {item[locale]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
