'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Search } from 'lucide-react';
import type { CdekPickupPoint } from '@/lib/cdek/types';

type Props = {
  points: CdekPickupPoint[];
  selectedCode: string;
  onSelect: (code: string) => void;
  loading?: boolean;
  error?: string | null;
};

export default function CdekPickupList({
  points,
  selectedCode,
  onSelect,
  loading,
  error,
}: Props) {
  const t = useTranslations('checkout');
  const [query, setQuery] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const normalized = query.trim().toLocaleLowerCase('ru');

  const filtered = useMemo(() => {
    if (!normalized) return points;
    return points.filter((p) => {
      const haystack = `${p.name} ${p.address} ${p.code}`.toLocaleLowerCase('ru');
      return haystack.includes(normalized);
    });
  }, [points, normalized]);

  useEffect(() => {
    if (!selectedCode) return;
    const el = itemRefs.current.get(selectedCode);
    if (el && listRef.current) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedCode]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-stone-100">
        <h3 className="font-semibold text-stone-900 mb-3">{t('cdek.pointsTitle')}</h3>
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('cdek.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
          />
        </div>
      </div>

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10 text-stone-500 gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">{t('cdek.loadingPoints')}</span>
          </div>
        ) : error ? (
          <p className="p-4 text-sm text-red-600">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="p-4 text-sm text-stone-500">
            {points.length === 0 ? t('cdek.noPoints') : t('cdek.noSearchMatches')}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {filtered.map((point) => {
              const isActive = point.code === selectedCode;
              return (
                <li key={point.code}>
                  <button
                    ref={(el) => {
                      if (el) itemRefs.current.set(point.code, el);
                      else itemRefs.current.delete(point.code);
                    }}
                    type="button"
                    onClick={() => onSelect(point.code)}
                    className={`w-full text-left px-4 py-3 transition-colors ${
                      isActive ? 'bg-rose-50' : 'hover:bg-stone-50'
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold ${
                        isActive ? 'text-rose-700' : 'text-stone-900'
                      }`}
                    >
                      {point.name}
                    </p>
                    {point.address && (
                      <p className="text-xs text-stone-500 mt-0.5 leading-snug">
                        {point.address}
                      </p>
                    )}
                    {point.workTime && (
                      <p className="text-[11px] text-stone-400 mt-1">
                        {point.workTime}
                      </p>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
