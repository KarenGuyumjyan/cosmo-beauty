'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import type {
  CdekCity,
  CdekDeliverySelection,
  CdekParcel,
  CdekPickupPoint,
} from '@/lib/cdek/types';
import CdekPickupSelector from '@/components/checkout/cdek/CdekPickupSelector';
import { DEFAULT_CHECKOUT_CITY } from '@/lib/cdek/default-city';
import { MINIMUM_ORDER_AMOUNT } from '@/lib/shop';

type Props = {
  parcels: CdekParcel[];
  totalPrice: number;
  onChange: (value: CdekDeliverySelection | null) => void;
};

type CdekUpstreamError = {
  error?: string;
  reason?: 'unserviceable' | 'auth' | 'unknown';
  hint?: string;
  upstreamStatus?: number;
  upstreamPath?: string;
  details?: string;
};

/**
 * Turn a failed CDEK response into a message worth showing a customer.
 *
 * `reason` picks the copy, so an unserved destination gets the friendly
 * "not available here" text rather than the API's own label. Diagnostics go to
 * the console: they used to be rendered, which put the server's prose (and its
 * upstream status code) in front of the customer and meant the localized
 * messages here were never seen.
 */
async function readError(
  response: Response,
  messages: { unserviceable: string; generic: string },
): Promise<string> {
  let data: CdekUpstreamError | null = null;
  try {
    data = (await response.clone().json()) as CdekUpstreamError;
  } catch {
    return messages.generic;
  }

  console.error('[cdek] request failed', {
    status: response.status,
    reason: data.reason,
    upstreamStatus: data.upstreamStatus,
    upstreamPath: data.upstreamPath,
    details: data.details,
    hint: data.hint,
  });

  return data.reason === 'unserviceable'
    ? messages.unserviceable
    : messages.generic;
}

export default function CdekPickupDelivery({
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

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [quote, setQuote] = useState<{
    tariffCode: number;
    cdekPrice: number;
  } | null>(null);
  const [points, setPoints] = useState<CdekPickupPoint[]>([]);
  const [selectedPointCode, setSelectedPointCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearch, setCitySearch] = useState('');

  const cityRequestId = useRef(0);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const citySearchRef = useRef<HTMLInputElement | null>(null);

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

  function handleCitySelect(nextCity: CdekCity) {
    setSelectedCity(nextCity);
    closeCityDropdown();
    setError(null);
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
      if (event.key === 'Escape') {
        closeCityDropdown();
      }
    }

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Load city options from the CDEK locations endpoint once.
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
        const loadedCities = Array.isArray(data) ? data : [];
        const hasDefault = loadedCities.some(
          (city) => city.code === DEFAULT_CHECKOUT_CITY.code,
        );
        const mergedCities = hasDefault
          ? loadedCities
          : [DEFAULT_CHECKOUT_CITY, ...loadedCities];
        setCities(mergedCities);
        setError(
          mergedCities.length === 0 ? t('cdek.errors.cityNotFound') : null,
        );
      } catch {
        if (requestId === cityRequestId.current) {
          setError(t('cdek.errors.resolveFailed'));
        }
      } finally {
        if (requestId === cityRequestId.current) {
          setLoadingCities(false);
        }
      }
    })();
  }, [t]);

  // Reset & load pickup points ONLY when the chosen city changes.
  // Parcels changes (cart edits) must not wipe the user's pickup-point selection.
  useEffect(() => {
    if (!selectedCity) return;

    let cancelled = false;

    void (async () => {
      try {
        setError(null);
        setQuote(null);
        setPoints([]);
        setSelectedPointCode('');
        setLoadingPoints(true);
        const res = await fetch('/api/delivery/cdek/pickup-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityCode: selectedCity.code }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setError(
            await readError(res, {
              unserviceable: t('cdek.errors.noPickupPoints'),
              generic: t('cdek.errors.loadFailed'),
            }),
          );
          return;
        }
        const p = (await res.json()) as CdekPickupPoint[];
        if (cancelled) return;
        setPoints(p);
        if (p.length === 0) setError(t('cdek.errors.noPickupPoints'));
      } catch {
        if (!cancelled) setError(t('cdek.errors.loadFailed'));
      } finally {
        if (!cancelled) setLoadingPoints(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCity, t]);

  // Recalculate the quote when city or cart parcels change.
  // Importantly, this does NOT reset `selectedPointCode` - the pickup point
  // stays selected while we re-quote.
  useEffect(() => {
    if (!selectedCity) return;
    let cancelled = false;

    void (async () => {
      try {
        setLoadingQuote(true);
        const res = await fetch('/api/delivery/cdek/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityCode: selectedCity.code,
            parcels,
            totalPrice,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          // 422 = CDEK does not serve this city with the pickup-point tariff.
          setError(
            await readError(res, {
              unserviceable: t('cdek.errors.noPickupPoints'),
              generic: t('cdek.errors.loadFailed'),
            }),
          );
          setQuote(null);
          return;
        }
        const q = (await res.json()) as {
          tariffCode: number;
          cdekPrice: number;
        };
        if (cancelled) return;
        setQuote(q);
      } catch {
        if (!cancelled) {
          setError(t('cdek.errors.loadFailed'));
          setQuote(null);
        }
      } finally {
        if (!cancelled) setLoadingQuote(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedCity, parcels, totalPrice, t]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.code === selectedPointCode) ?? null,
    [points, selectedPointCode],
  );

  useEffect(() => {
    if (!selectedCity || !selectedPoint || !quote) {
      onChange(null);
      return;
    }
    onChange({
      city: selectedCity.city,
      cityCode: selectedCity.code,
      pickupPointCode: selectedPoint.code,
      pickupPointName: selectedPoint.name,
      pickupPointAddress: selectedPoint.address,
      tariffCode: quote.tariffCode,
      cdekPrice: quote.cdekPrice,
      finalPrice: quote.cdekPrice,
    });
  }, [selectedCity, selectedPoint, quote, onChange]);

  return (
    <div className='bg-white rounded-2xl border border-stone-100 p-6 space-y-5'>
      <div className='flex items-baseline justify-between gap-4'>
        <h2 className='font-bold text-stone-900 text-lg'>{t('cdek.title')}</h2>
        {quote && !loadingQuote && (
          <div className='flex items-center gap-2'>
            {/* Free from MINIMUM_ORDER_AMOUNT upwards; below it the customer pays. */}
            {totalPrice >= MINIMUM_ORDER_AMOUNT ? (
              <>
                <span className='text-rose-700'>{t('shopPickupFree')}</span>
                <span className='text-sm text-stone-600 line-through'>
                  <strong>{quote.cdekPrice.toLocaleString()} ₽</strong>
                </span>
              </>
            ) : (
              <span className='text-sm text-stone-600'>
                <strong>{quote.cdekPrice.toLocaleString()} ₽</strong>
              </span>
            )}
          </div>
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
                          onClick={() => handleCitySelect(city)}
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
        {loadingCities && (
          <p className='mt-2 text-xs text-stone-500'>
            {t('cdek.resolvingCity')}
          </p>
        )}
        {!loadingCities && !selectedCity && cities.length === 0 && error && (
          <p className='mt-2 text-xs text-red-600'>{error}</p>
        )}
      </div>

      {/* Desktop */}
      {selectedPoint && (
        <div className='hidden md:flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3'>
          <MapPin size={18} className='text-rose-600 shrink-0 mt-0.5' />
          <div className='text-sm text-stone-800'>
            <p className='font-semibold'>{selectedPoint.name}</p>
            {selectedPoint.address && (
              <p className='text-stone-600 mt-0.5'>{selectedPoint.address}</p>
            )}
            {selectedPoint.workTime && (
              <p className='text-xs text-stone-500 mt-1'>
                {selectedPoint.workTime}
              </p>
            )}
          </div>
        </div>
      )}
      {selectedCity && (
        <CdekPickupSelector
          points={points}
          selectedCode={selectedPointCode}
          onSelect={setSelectedPointCode}
          loading={loadingPoints}
          error={!loadingPoints ? error : null}
          hintCenter={null}
        />
      )}

      {/* Mobile */}
      {selectedPoint && (
        <div className='md:hidden flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3'>
          <MapPin size={18} className='text-rose-600 shrink-0 mt-0.5' />
          <div className='text-sm text-stone-800'>
            <p className='font-semibold'>{selectedPoint.name}</p>
            {selectedPoint.address && (
              <p className='text-stone-600 mt-0.5'>{selectedPoint.address}</p>
            )}
            {selectedPoint.workTime && (
              <p className='text-xs text-stone-500 mt-1'>
                {selectedPoint.workTime}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
