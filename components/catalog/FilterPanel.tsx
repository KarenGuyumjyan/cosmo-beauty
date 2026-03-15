'use client';

import { useTranslations } from 'next-intl';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { categories } from '@/lib/data';
import { Locale, SortOption } from '@/lib/types';

interface FilterPanelProps {
  locale: Locale;
  selectedCategory: string;
  selectedSize: string;
  sortBy: SortOption;
  allSizes: string[];
  onCategoryChange: (v: string) => void;
  onSizeChange: (v: string) => void;
  onSortChange: (v: SortOption) => void;
  onReset: () => void;
  totalResults: number;
}

export default function FilterPanel({
  locale,
  selectedCategory,
  selectedSize,
  sortBy,
  allSizes,
  onCategoryChange,
  onSizeChange,
  onSortChange,
  onReset,
  totalResults,
}: FilterPanelProps) {
  const t = useTranslations('catalog');

  const sortOptions: { value: SortOption; labelKey: string }[] = [
    { value: 'popular', labelKey: 'sort.popular' },
    { value: 'priceAsc', labelKey: 'sort.priceAsc' },
    { value: 'priceDesc', labelKey: 'sort.priceDesc' },
    { value: 'newest', labelKey: 'sort.newest' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 sticky top-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 mb-6">
        <div className="flex items-center gap-2 text-stone-800 font-semibold min-w-0">
          <SlidersHorizontal size={17} className="shrink-0 text-rose-600" />
          <span className="truncate">{t('filters.title')}</span>
        </div>
        <button
          onClick={onReset}
          className="flex shrink-0 items-center gap-1 text-xs text-stone-400 hover:text-rose-600 transition-colors"
        >
          <RotateCcw size={12} className="shrink-0" />
          {t('filters.reset')}
        </button>
      </div>

      {/* Sort */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2.5">
          {t('sort.label')}
        </label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700 bg-white focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.labelKey as Parameters<typeof t>[0])}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2.5">
          {t('filters.category')}
        </label>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => onCategoryChange('')}
            className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
              selectedCategory === ''
                ? 'bg-rose-600 text-white font-medium'
                : 'text-stone-600 hover:bg-rose-50 hover:text-rose-700'
            }`}
          >
            {t('filters.all')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => onCategoryChange(cat.value)}
              className={`text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-rose-600 text-white font-medium'
                  : 'text-stone-600 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              {cat.label[locale]}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2.5">
          {t('filters.size')}
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onSizeChange('')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selectedSize === ''
                ? 'bg-rose-600 text-white border-rose-600'
                : 'border-stone-200 text-stone-600 hover:border-rose-400 hover:text-rose-600'
            }`}
          >
            {t('filters.all')}
          </button>
          {allSizes.map((size) => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedSize === size
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'border-stone-200 text-stone-600 hover:border-rose-400 hover:text-rose-600'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="pt-4 border-t border-stone-100">
        <p className="text-sm text-stone-500">
          <span className="font-semibold text-rose-600">{totalResults}</span>{' '}
          {t('results', { count: totalResults })}
        </p>
      </div>
    </div>
  );
}
