'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { products, allSizes } from '@/lib/data';
import { Locale, SortOption } from '@/lib/types';
import FilterPanel from './FilterPanel';
import ProductCard from '@/components/ui/ProductCard';

interface ProductGridProps {
  locale: Locale;
}

export default function ProductGrid({ locale }: ProductGridProps) {
  const t = useTranslations('catalog');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [search, setSearch] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.en.toLowerCase().includes(q) ||
          p.name[locale].toLowerCase().includes(q) ||
          p.category.includes(q)
      );
    }
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (selectedSize) result = result.filter((p) => p.size === selectedSize);

    switch (sortBy) {
      case 'priceAsc':
        result.sort((a, b) => (a.discountedPrice ?? a.price) - (b.discountedPrice ?? b.price));
        break;
      case 'priceDesc':
        result.sort((a, b) => (b.discountedPrice ?? b.price) - (a.discountedPrice ?? a.price));
        break;
      case 'newest':
        result.sort((a, b) => Number(b.id) - Number(a.id));
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0));
    }
    return result;
  }, [selectedCategory, selectedSize, sortBy, search, locale]);

  const handleReset = () => {
    setSelectedCategory('');
    setSelectedSize('');
    setSortBy('popular');
    setSearch('');
  };

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileFiltersOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileFiltersOpen]);

  const filterPanelProps = {
    locale,
    selectedCategory,
    selectedSize,
    sortBy,
    allSizes,
    onCategoryChange: setSelectedCategory,
    onSizeChange: setSelectedSize,
    onSortChange: setSortBy,
    onReset: handleReset,
    totalResults: filtered.length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search bar + mobile filter toggle row */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-xl">
          <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filters.title') + '…'}
            className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-2xl text-sm bg-white focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
          />
        </div>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="lg:hidden flex items-center gap-2 border border-stone-200 rounded-2xl px-4 py-3 text-sm font-medium text-stone-600 hover:border-rose-400 hover:text-rose-600 transition-colors shrink-0"
        >
          <SlidersHorizontal size={16} />
          {t('filters.title')}
        </button>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileFiltersOpen(false)}
          />
          {/* Drawer */}
          <div className="relative w-80 max-w-[85vw] h-full bg-stone-50 overflow-y-auto shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 bg-white sticky top-0 z-10">
              <span className="font-semibold text-stone-800">{t('filters.title')}</span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4 flex-1">
              <FilterPanel {...filterPanelProps} />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <FilterPanel {...filterPanelProps} />
        </aside>

        {/* Grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-stone-500">{t('noResults')}</p>
              <button
                onClick={handleReset}
                className="mt-4 text-rose-600 hover:underline text-sm font-medium"
              >
                {t('filters.reset')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
