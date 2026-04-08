'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Locale } from '@/lib/types';
import ProductCard from '@/components/ui/ProductCard';

interface ProductCarouselProps {
  products: Product[];
  locale: Locale;
  titleKey?: 'featured' | 'bestsellers';
}

export default function ProductCarousel({
  products,
  locale,
  titleKey = 'featured',
}: ProductCarouselProps) {
  const t = useTranslations(`home.${titleKey}`);
  const tHome = useTranslations('home.featured');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const GAP = 24;

  const getCardWidth = () =>
    typeof window !== 'undefined' && window.innerWidth >= 768 ? 280 : 180;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const step = getCardWidth() + GAP;
    el.scrollBy({ left: dir === 'right' ? step : -step, behavior: 'smooth' });
    setTimeout(updateScrollState, 400);
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-rose-600 text-sm font-medium tracking-widest uppercase mb-2">
              {t('subtitle')}
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold text-stone-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {t('title')}
            </h2>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center text-stone-500 hover:bg-rose-600 hover:text-white hover:border-rose-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          onScroll={updateScrollState}
          className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {products.map((product, i) => (
            <div key={product.id} className="snap-start shrink-0 w-45 md:w-70">
              <ProductCard product={product} locale={locale} priority={i < 4} />
            </div>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <a
            href={`/${locale}/catalog`}
            className="inline-flex items-center gap-2 border border-stone-200 hover:border-rose-400 hover:text-rose-600 text-stone-600 font-medium px-8 py-3 rounded-full text-sm transition-all duration-200"
          >
            {tHome('viewAll')}
            <ChevronRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
