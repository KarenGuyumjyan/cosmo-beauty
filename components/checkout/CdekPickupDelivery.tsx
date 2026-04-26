'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import type {
  CdekCity,
  CdekDeliverySelection,
  CdekParcel,
  CdekPickupPoint,
} from '@/lib/cdek/types';
import CdekPickupSelector from '@/components/checkout/cdek/CdekPickupSelector';

type Props = {
  parcels: CdekParcel[];
  onChange: (value: CdekDeliverySelection | null) => void;
};

const PACKAGING = 0;
const MARKUP = 0;

type CdekUpstreamError = {
  error?: string;
  hint?: string;
  upstreamStatus?: number;
  upstreamPath?: string;
  details?: string;
};

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.clone().json()) as CdekUpstreamError;
    const parts = [
      data.error,
      data.upstreamStatus ? `(${data.upstreamStatus})` : null,
      data.hint,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  } catch {
    /* fall through to text */
  }
  try {
    const text = await response.text();
    if (text) return text.slice(0, 400);
  } catch {
    /* ignore */
  }
  return fallback;
}

export default function CdekPickupDelivery({ parcels, onChange }: Props) {
  const t = useTranslations('checkout');

  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [quote, setQuote] = useState<{ tariffCode: number; cdekPrice: number } | null>(null);
  const [points, setPoints] = useState<CdekPickupPoint[]>([]);
  const [selectedPointCode, setSelectedPointCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const cityRequestId = useRef(0);

  function handleQueryChange(value: string) {
    setQuery(value);
    setSelectedCity(null);
    setCities([]);
    setError(null);
  }

  // Debounced direct call to CDEK city search.
  useEffect(() => {
    const trimmed = (query ?? '').trim();
    if (selectedCity && trimmed === (selectedCity.city ?? '').trim()) {
      setCities([]);
      return;
    }
    if (trimmed.length < 2) {
      setCities([]);
      setLoadingCities(false);
      return;
    }

    const handle = setTimeout(() => {
      const requestId = ++cityRequestId.current;
      void (async () => {
        setLoadingCities(true);
        try {
          const res = await fetch(
            `/api/delivery/cdek/cities?query=${encodeURIComponent(trimmed)}`,
          );
          if (requestId !== cityRequestId.current) return;
          if (!res.ok) {
            setCities([]);
            setError(await readErrorMessage(res, t('cdek.errors.resolveFailed')));
            return;
          }
          const data = (await res.json()) as CdekCity[];
          if (requestId !== cityRequestId.current) return;
          setCities(Array.isArray(data) ? data : []);
          if (Array.isArray(data) && data.length === 0) {
            setError(t('cdek.errors.cityNotFound'));
          } else {
            setError(null);
          }
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
    }, 350);

    return () => clearTimeout(handle);
  }, [query, selectedCity, t]);

  // Reset & load pickup points ONLY when the chosen city changes.
  // Parcels changes (cart edits) must not wipe the user's pickup-point selection.
  useEffect(() => {
    setError(null);
    setQuote(null);
    setPoints([]);
    setSelectedPointCode('');
    if (!selectedCity) return;

    let cancelled = false;
    setLoadingPoints(true);

    void (async () => {
      try {
        const res = await fetch('/api/delivery/cdek/pickup-points', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityCode: selectedCity.code }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setError(await readErrorMessage(res, t('cdek.errors.loadFailed')));
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
  // Importantly, this does NOT reset `selectedPointCode` — the pickup point
  // stays selected while we re-quote.
  useEffect(() => {
    if (!selectedCity) return;
    let cancelled = false;
    setLoadingQuote(true);

    void (async () => {
      try {
        const res = await fetch('/api/delivery/cdek/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cityCode: selectedCity.code, parcels }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setError(await readErrorMessage(res, t('cdek.errors.loadFailed')));
          setQuote(null);
          return;
        }
        const q = (await res.json()) as { tariffCode: number; cdekPrice: number };
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
  }, [selectedCity, parcels, t]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.code === selectedPointCode) ?? null,
    [points, selectedPointCode],
  );

  useEffect(() => {
    if (!selectedCity || !selectedPoint || !quote) {
      onChange(null);
      return;
    }
    const finalPrice = quote.cdekPrice + PACKAGING + MARKUP;
    onChange({
      city: selectedCity.city,
      cityCode: selectedCity.code,
      pickupPointCode: selectedPoint.code,
      pickupPointName: selectedPoint.name,
      pickupPointAddress: selectedPoint.address,
      tariffCode: quote.tariffCode,
      cdekPrice: quote.cdekPrice,
      finalPrice,
    });
  }, [selectedCity, selectedPoint, quote, onChange]);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-6 space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-bold text-stone-900 text-lg">{t('cdek.title')}</h2>
        {quote && !loadingQuote && (
          <span className="text-sm text-stone-600">
            {t('cdek.priceLabel')}{' '}
            <strong>{quote.cdekPrice.toLocaleString()} ₽</strong>
          </span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">
          {t('cdek.cityLabel')}
        </label>
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('cdek.cityPlaceholder')}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
        />
        {loadingCities && (
          <p className="mt-2 text-xs text-stone-500">{t('cdek.resolvingCity')}</p>
        )}
        {cities.length > 0 && !selectedCity && (
          <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
            {cities.length > 1 && (
              <p className="px-3 py-2 text-xs text-stone-500 bg-stone-50 border-b border-stone-100">
                {t('cdek.multiCityTitle')}
              </p>
            )}
            {cities.map((city) => (
              <button
                key={`${city.code}-${city.region ?? ''}`}
                type="button"
                onClick={() => {
                  cityRequestId.current += 1;
                  setSelectedCity(city);
                  setQuery(city.city ?? '');
                  setCities([]);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
              >
                <span className="font-medium text-stone-800">{city.city}</span>
                {city.region ? <span className="text-stone-500">, {city.region}</span> : null}
              </button>
            ))}
          </div>
        )}
        {!loadingCities && !selectedCity && cities.length === 0 && error && (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        )}
      </div>

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

      {selectedPoint && (
        <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3">
          <MapPin size={18} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-stone-800">
            <p className="font-semibold">{selectedPoint.name}</p>
            {selectedPoint.address && (
              <p className="text-stone-600 mt-0.5">{selectedPoint.address}</p>
            )}
            {selectedPoint.workTime && (
              <p className="text-xs text-stone-500 mt-1">{selectedPoint.workTime}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
