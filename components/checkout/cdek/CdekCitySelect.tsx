'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Search } from 'lucide-react';
import type { CdekCity } from '@/lib/cdek/types';
import { DEFAULT_CHECKOUT_CITY } from '@/lib/cdek/default-city';

type Props = {
  value: CdekCity | null;
  onChange: (city: CdekCity) => void;
  /** Lets the parent surface a lookup failure next to its own CDEK errors. */
  onError?: (message: string | null) => void;
};

/** Matches the server's own floor - shorter queries list the default page. */
const MIN_QUERY_LENGTH = 2;

const TRIGGER_CLASS_NAME =
  'w-full bg-white px-4 py-3 pr-11 border border-stone-200 rounded-xl text-sm text-left focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed';

/**
 * City picker shared by the pickup-point and courier delivery forms.
 *
 * Searching happens on the server on every keystroke rather than by filtering
 * a preloaded list: `/location/cities` is paginated, so a preloaded list is one
 * arbitrary page of Russia and every city outside it was unreachable. The route
 * answers from CDEK's geocoder, which searches the whole country.
 */
export default function CdekCitySelect({ value, onChange, onError }: Props) {
  const t = useTranslations('checkout');

  const [cities, setCities] = useState<CdekCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const requestId = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  function open() {
    setIsOpen(true);
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 0);
  }

  function close() {
    setIsOpen(false);
    setSearch('');
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current) return;
      const target = event.target;
      if (target instanceof Node && !containerRef.current.contains(target)) {
        close();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // One debounced lookup per query, including the empty one that fills the
  // list on first open.
  useEffect(() => {
    const query = search.trim();
    const id = ++requestId.current;

    const timer = setTimeout(
      () => {
        void (async () => {
          setLoading(true);
          try {
            const url =
              query.length >= MIN_QUERY_LENGTH
                ? `/api/delivery/cdek/cities?query=${encodeURIComponent(query)}`
                : '/api/delivery/cdek/cities';
            const res = await fetch(url);
            if (id !== requestId.current) return;
            if (!res.ok) {
              setCities([]);
              onError?.(t('cdek.errors.resolveFailed'));
              return;
            }
            const data = (await res.json()) as CdekCity[];
            if (id !== requestId.current) return;
            const loaded = Array.isArray(data) ? data : [];
            // Moscow is the default selection, so it has to be selectable even
            // when a query pushes it out of the results.
            const hasDefault = loaded.some(
              (city) => city.code === DEFAULT_CHECKOUT_CITY.code,
            );
            setCities(
              hasDefault || query.length >= MIN_QUERY_LENGTH
                ? loaded
                : [DEFAULT_CHECKOUT_CITY, ...loaded],
            );
            onError?.(null);
          } catch {
            if (id === requestId.current) {
              setCities([]);
              onError?.(t('cdek.errors.resolveFailed'));
            }
          } finally {
            if (id === requestId.current) setLoading(false);
          }
        })();
      },
      // The first, query-less load should not sit behind a debounce.
      query ? 300 : 0,
    );

    return () => clearTimeout(timer);
    // `onError` is a parent setState and stable in practice; including it would
    // re-run the lookup on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, t]);

  return (
    <div>
      <label className='block text-sm font-medium text-stone-700 mb-1.5'>
        {t('cdek.cityLabel')}
      </label>
      <div className='relative' ref={containerRef}>
        <button
          type='button'
          className={`${TRIGGER_CLASS_NAME} ${value ? 'text-stone-800' : 'text-stone-400'}`}
          onClick={() => (isOpen ? close() : open())}
          aria-haspopup='listbox'
          aria-expanded={isOpen}
        >
          {value
            ? `${value.city}${value.region ? `, ${value.region}` : ''}`
            : t('cdek.cityPlaceholder')}
        </button>
        <ChevronDown
          size={16}
          className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform text-stone-400 ${isOpen ? 'rotate-180' : ''}`}
        />
        {isOpen && (
          <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50'>
            <div className='p-2 border-b border-stone-100'>
              <div className='relative'>
                <Search
                  size={14}
                  className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400'
                />
                <input
                  ref={searchRef}
                  type='text'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('cdek.citySearchPlaceholder')}
                  className='w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors placeholder-stone-400 text-stone-800'
                />
              </div>
            </div>
            <ul className='max-h-52 overflow-y-auto py-1' role='listbox'>
              {loading ? (
                <li className='px-4 py-4 text-center text-sm text-stone-400'>
                  {t('cdek.resolvingCity')}
                </li>
              ) : cities.length > 0 ? (
                cities.map((city) => {
                  const isSelected = value?.code === city.code;
                  return (
                    <li
                      key={`${city.code}-${city.region ?? ''}`}
                      role='option'
                      aria-selected={isSelected}
                    >
                      <button
                        type='button'
                        onClick={() => {
                          onChange(city);
                          close();
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs transition-colors hover:bg-rose-50 ${
                          isSelected
                            ? 'bg-rose-50 text-rose-700'
                            : 'text-stone-700'
                        }`}
                      >
                        <span className='font-semibold text-sm'>
                          {city.city}
                        </span>
                        {city.region ? `, ${city.region}` : ''}
                      </button>
                    </li>
                  );
                })
              ) : (
                <li className='px-4 py-4 text-center text-sm text-stone-400'>
                  {t('cdek.errors.cityNotFound')}
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
