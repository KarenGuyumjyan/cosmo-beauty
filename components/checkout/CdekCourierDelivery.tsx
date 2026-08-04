'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, Search, Truck } from 'lucide-react';
import type {
  CdekCity,
  CdekCourierSelection,
  CdekParcel,
  CdekQuoteResult,
} from '@/lib/cdek/types';
import { CDEK_TARIFF_COURIER } from '@/lib/cdek/tariffs';
import { DEFAULT_CHECKOUT_CITY } from '@/lib/cdek/default-city';

type Props = {
  parcels: CdekParcel[];
  totalPrice: number;
  onChange: (value: CdekCourierSelection | null) => void;
};

type ErrorPayload = {
  error?: string;
  reason?: 'unserviceable' | 'auth' | 'unknown';
  hint?: string;
  upstreamStatus?: number;
  details?: string;
};

/**
 * Turn a failed CDEK response into a message worth showing a customer.
 *
 * `reason` decides the copy: an unserved destination is a normal answer and
 * gets the friendly "not available here" text, while anything else gets the
 * generic retry message. Raw CDEK payloads go to the console only - they used
 * to be concatenated into the visible string, which surfaced 600 characters of
 * JSON in the checkout form.
 */
async function readError(
  response: Response,
  messages: { unserviceable: string; generic: string },
): Promise<string> {
  let data: ErrorPayload | null = null;
  try {
    data = (await response.json()) as ErrorPayload;
  } catch {
    return messages.generic;
  }

  console.error('[cdek] request failed', {
    status: response.status,
    reason: data.reason,
    upstreamStatus: data.upstreamStatus,
    details: data.details,
    hint: data.hint,
  });

  return data.reason === 'unserviceable'
    ? messages.unserviceable
    : messages.generic;
}

/**
 * CDEK courier delivery (tariff 137, склад-дверь).
 *
 * Mirrors CdekPickupDelivery, but the destination is a street address the
 * customer types rather than a pickup point, because tariff 137 has no
 * delivery point. Always paid - the free-shipping threshold does not apply.
 */
export default function CdekCourierDelivery({
  parcels,
  totalPrice,
  onChange,
}: Props) {
  const t = useTranslations('checkout');
  const cityTriggerClassName =
    'w-full bg-white px-4 py-3 pr-11 border border-stone-200 rounded-xl text-sm text-left focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors disabled:bg-stone-50 disabled:text-stone-400 disabled:cursor-not-allowed';

  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(
    DEFAULT_CHECKOUT_CITY,
  );
  const [loadingCities, setLoadingCities] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [entrance, setEntrance] = useState('');
  const [floor, setFloor] = useState('');
  const [quote, setQuote] = useState<CdekQuoteResult | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hints, setHints] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);

  const cityRequestId = useRef(0);
  const quoteRequestId = useRef(0);
  const hintRequestId = useRef(0);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const citySearchRef = useRef<HTMLInputElement | null>(null);
  const addressBoxRef = useRef<HTMLDivElement | null>(null);
  // Set when the customer picks a suggestion, so choosing one does not
  // immediately trigger a fresh lookup for the text we just inserted.
  const suppressNextHintFetch = useRef(false);

  const filteredCities = useMemo(() => {
    const q = citySearch.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) =>
        c.city.toLowerCase().includes(q) ||
        (c.region ?? '').toLowerCase().includes(q),
    );
  }, [cities, citySearch]);

  function openCityDropdown() {
    setIsCityDropdownOpen(true);
    setCitySearch('');
    setTimeout(() => citySearchRef.current?.focus(), 0);
  }

  function closeCityDropdown() {
    setIsCityDropdownOpen(false);
    setCitySearch('');
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!cityDropdownRef.current) return;
      const target = event.target;
      if (target instanceof Node && !cityDropdownRef.current.contains(target)) {
        closeCityDropdown();
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closeCityDropdown();
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Load the city list once.
  useEffect(() => {
    const requestId = ++cityRequestId.current;
    void (async () => {
      setLoadingCities(true);
      try {
        const res = await fetch('/api/delivery/cdek/cities');
        if (requestId !== cityRequestId.current) return;
        if (!res.ok) {
          setCities([]);
          setError(
            await readError(res, {
              unserviceable: t('cdek.errors.cityNotFound'),
              generic: t('cdek.errors.resolveFailed'),
            }),
          );
          return;
        }
        const data = (await res.json()) as CdekCity[];
        if (requestId !== cityRequestId.current) return;
        const loaded = Array.isArray(data) ? data : [];
        const hasDefault = loaded.some(
          (city) => city.code === DEFAULT_CHECKOUT_CITY.code,
        );
        setCities(hasDefault ? loaded : [DEFAULT_CHECKOUT_CITY, ...loaded]);
      } catch {
        if (requestId === cityRequestId.current) {
          setError(t('cdek.errors.resolveFailed'));
        }
      } finally {
        if (requestId === cityRequestId.current) setLoadingCities(false);
      }
    })();
  }, [t]);

  // Price courier delivery for the selected city. The address does not affect
  // the tariff calculation, so this deliberately does not depend on it.
  useEffect(() => {
    if (!selectedCity) return;
    const requestId = ++quoteRequestId.current;
    void (async () => {
      setLoadingQuote(true);
      try {
        const res = await fetch('/api/delivery/cdek/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityCode: selectedCity.code,
            parcels,
            totalPrice,
            tariffCode: CDEK_TARIFF_COURIER,
          }),
        });
        if (requestId !== quoteRequestId.current) return;
        if (!res.ok) {
          setQuote(null);
          // A 422 here means CDEK does not serve this city by courier, which is
          // the message the customer actually needs to see.
          setError(
            await readError(res, {
              unserviceable: t('cdek.errors.courierUnavailable'),
              generic: t('cdek.errors.loadFailed'),
            }),
          );
          return;
        }
        const q = (await res.json()) as CdekQuoteResult;
        if (requestId !== quoteRequestId.current) return;
        setQuote(q.cdekPrice > 0 ? q : null);
        setError(q.cdekPrice > 0 ? null : t('cdek.errors.courierUnavailable'));
      } catch {
        if (requestId === quoteRequestId.current) {
          setQuote(null);
          setError(t('cdek.errors.loadFailed'));
        }
      } finally {
        if (requestId === quoteRequestId.current) setLoadingQuote(false);
      }
    })();
  }, [selectedCity, parcels, totalPrice, t]);

  // Close the hint list on outside click / Escape.
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!addressBoxRef.current) return;
      const target = event.target;
      if (target instanceof Node && !addressBoxRef.current.contains(target)) {
        setShowHints(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowHints(false);
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Debounced address autocomplete, scoped to the selected city.
  // Hints are advisory only: a failure never blocks checkout, and the customer
  // can always submit free-typed text.
  useEffect(() => {
    if (suppressNextHintFetch.current) {
      suppressNextHintFetch.current = false;
      return;
    }
    const query = address.trim();
    // Nothing to look up yet. Stale hints are filtered out during render
    // (`visibleHints`) rather than cleared here, which would mean calling
    // setState synchronously inside an effect.
    if (query.length < 3) return;

    const requestId = ++hintRequestId.current;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch('/api/delivery/address-hints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, city: selectedCity?.city ?? '' }),
          });
          if (requestId !== hintRequestId.current) return;
          if (!res.ok) return;
          const data = (await res.json()) as { hints?: string[] };
          if (requestId !== hintRequestId.current) return;
          const next = Array.isArray(data.hints) ? data.hints : [];
          setHints(next);
          setShowHints(next.length > 0);
        } catch {
          /* hints are optional - stay silent */
        }
      })();
    }, 300);

    return () => clearTimeout(timer);
  }, [address, selectedCity]);

  function handleHintSelect(hint: string) {
    suppressNextHintFetch.current = true;
    setAddress(hint);
    setShowHints(false);
  }

  // Derived so a shortened query hides stale suggestions without setState in
  // an effect.
  const visibleHints =
    showHints && address.trim().length >= 3 ? hints : [];

  // Publish the selection upward once city, address and price are all known.
  useEffect(() => {
    if (!selectedCity || !quote || !address.trim()) {
      onChange(null);
      return;
    }
    onChange({
      city: selectedCity.city,
      cityCode: selectedCity.code,
      address: address.trim(),
      // Kept apart from `address` so the suggestion stays a clean street line;
      // formatCourierAddress folds them together at order creation.
      apartment: apartment.trim(),
      entrance: entrance.trim(),
      floor: floor.trim(),
      tariffCode: quote.tariffCode,
      cdekPrice: quote.cdekPrice,
      // Courier delivery is always charged at the quoted price.
      finalPrice: quote.cdekPrice,
      periodMin: quote.periodMin,
      periodMax: quote.periodMax,
    });
  }, [selectedCity, quote, address, apartment, entrance, floor, onChange]);

  const deliveryDays =
    quote?.periodMin && quote?.periodMax
      ? quote.periodMin === quote.periodMax
        ? `${quote.periodMin}`
        : `${quote.periodMin}-${quote.periodMax}`
      : null;

  return (
    <div className='bg-white rounded-2xl border border-stone-100 p-6 space-y-5'>
      <div className='flex items-baseline justify-between gap-4'>
        <h2 className='font-bold text-stone-900 text-lg'>
          {t('cdek.courierTitle')}
        </h2>
        {quote && !loadingQuote && (
          // Always paid: no strike-through, no "free" label.
          <span className='text-sm font-semibold text-stone-800'>
            {quote.cdekPrice.toLocaleString()} ₽
          </span>
        )}
      </div>

      <div>
        <label className='block text-sm font-medium text-stone-700 mb-1.5'>
          {t('cdek.cityLabel')}
        </label>
        <div className='relative' ref={cityDropdownRef}>
          <button
            type='button'
            className={`${cityTriggerClassName} ${selectedCity ? 'text-stone-800' : 'text-stone-400'}`}
            onClick={() =>
              isCityDropdownOpen ? closeCityDropdown() : openCityDropdown()
            }
            disabled={loadingCities || cities.length === 0}
            aria-haspopup='listbox'
            aria-expanded={isCityDropdownOpen}
          >
            {selectedCity
              ? `${selectedCity.city}${selectedCity.region ? `, ${selectedCity.region}` : ''}`
              : t('cdek.cityPlaceholder')}
          </button>
          <ChevronDown
            size={16}
            className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform ${loadingCities ? 'text-stone-300' : 'text-stone-400'} ${isCityDropdownOpen ? 'rotate-180' : ''}`}
          />
          {isCityDropdownOpen && (
            <div className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50'>
              <div className='p-2 border-b border-stone-100'>
                <div className='relative'>
                  <Search
                    size={14}
                    className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400'
                  />
                  <input
                    ref={citySearchRef}
                    type='text'
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    placeholder={t('cdek.citySearchPlaceholder')}
                    className='w-full pl-8 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors placeholder-stone-400 text-stone-800'
                  />
                </div>
              </div>
              <ul className='max-h-52 overflow-y-auto py-1' role='listbox'>
                {filteredCities.length > 0 ? (
                  filteredCities.map((city) => {
                    const isSelected = selectedCity?.code === city.code;
                    return (
                      <li
                        key={`${city.code}-${city.region ?? ''}`}
                        role='option'
                        aria-selected={isSelected}
                      >
                        <button
                          type='button'
                          onClick={() => {
                            setSelectedCity(city);
                            closeCityDropdown();
                            setError(null);
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

      <div>
        <label
          htmlFor='cdek-courier-address'
          className='block text-sm font-medium text-stone-700 mb-1.5'
        >
          {t('cdek.addressLabel')}
        </label>
        <div className='relative' ref={addressBoxRef}>
          <input
            id='cdek-courier-address'
            type='text'
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={() => {
              if (hints.length > 0) setShowHints(true);
            }}
            placeholder={t('cdek.addressPlaceholder')}
            className='w-full bg-white px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors placeholder-stone-400 text-stone-800'
            // Browser autofill would cover the suggestion list.
            autoComplete='off'
            role='combobox'
            aria-expanded={visibleHints.length > 0}
            aria-controls='cdek-courier-address-hints'
            aria-autocomplete='list'
          />
          {visibleHints.length > 0 && (
            <ul
              id='cdek-courier-address-hints'
              className='absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-stone-200 bg-white shadow-lg shadow-stone-200/50 py-1'
              role='listbox'
            >
              {visibleHints.map((hint) => (
                <li key={hint} role='option' aria-selected={hint === address}>
                  <button
                    type='button'
                    onClick={() => handleHintSelect(hint)}
                    className='w-full px-4 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-rose-50 hover:text-rose-700'
                  >
                    {hint}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className='text-xs text-stone-400 mt-1.5'>
          {t('cdek.addressHint')}
        </p>

        {/* Optional details the courier needs at the door. Kept out of the
            address input so an autocomplete pick never overwrites them. */}
        <div className='grid grid-cols-3 gap-3 mt-3'>
          {(
            [
              {
                id: 'cdek-courier-apartment',
                label: t('cdek.apartmentLabel'),
                value: apartment,
                onChange: setApartment,
                inputMode: 'text' as const,
              },
              {
                id: 'cdek-courier-entrance',
                label: t('cdek.entranceLabel'),
                value: entrance,
                onChange: setEntrance,
                inputMode: 'numeric' as const,
              },
              {
                id: 'cdek-courier-floor',
                label: t('cdek.floorLabel'),
                value: floor,
                onChange: setFloor,
                inputMode: 'numeric' as const,
              },
            ]
          ).map((field) => (
            <div key={field.id}>
              <label
                htmlFor={field.id}
                className='block text-sm font-medium text-stone-700 mb-1.5'
              >
                {field.label}
              </label>
              <input
                id={field.id}
                type='text'
                inputMode={field.inputMode}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                maxLength={12}
                className='w-full bg-white px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors placeholder-stone-400 text-stone-800'
                autoComplete='off'
              />
            </div>
          ))}
        </div>
      </div>

      {(loadingQuote || deliveryDays) && (
        <div className='flex items-center gap-2 text-sm text-stone-600 border-t border-dashed border-stone-100 pt-4'>
          <Truck size={15} className='text-stone-400' />
          {loadingQuote ? (
            <span className='text-stone-400'>{t('cdek.calculating')}</span>
          ) : (
            <span>{t('cdek.deliveryDays', { days: deliveryDays! })}</span>
          )}
        </div>
      )}

      {error && (
        <p className='text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3'>
          {error}
        </p>
      )}
    </div>
  );
}
