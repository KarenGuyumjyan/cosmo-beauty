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
import {
  fetchYandexGeocodeCenter,
  fetchYandexSuggestAddresses,
} from '@/lib/yandex-maps/suggest';

type Props = {
  parcels: CdekParcel[];
  onChange: (value: CdekDeliverySelection | null) => void;
};

const PACKAGING = 0;
const MARKUP = 0;

async function resolveCdekCitiesFromFormatted(formatted: string): Promise<CdekCity[]> {
  const parts = formatted.split(',').map((s) => s.trim()).filter(Boolean);
  const skip = new Set(['россия', 'russia', 'рф', 'the russian federation']);
  const candidates = parts.filter((p) => !skip.has(p.toLowerCase()));
  const ordered = [...candidates, formatted.trim()];
  const tried = new Set<string>();
  for (const q of ordered) {
    const key = q.slice(0, 80);
    if (key.length < 2 || tried.has(key)) continue;
    tried.add(key);
    const res = await fetch(`/api/delivery/cdek/cities?query=${encodeURIComponent(key)}`);
    if (!res.ok) continue;
    const data: unknown = await res.json();
    if (!Array.isArray(data) || data.length === 0) continue;
    return data as CdekCity[];
  }
  return [];
}

export default function CdekPickupDelivery({ parcels, onChange }: Props) {
  const t = useTranslations('checkout');
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cities, setCities] = useState<CdekCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(null);
  const [loadingCities, setLoadingCities] = useState(false);

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [quote, setQuote] = useState<{ tariffCode: number; cdekPrice: number } | null>(null);
  const [points, setPoints] = useState<CdekPickupPoint[]>([]);
  const [selectedPointCode, setSelectedPointCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hintCenter, setHintCenter] = useState<[number, number] | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestRequestId = useRef(0);
  /** After picking a Yandex line we set `query` programmatically — do not re-fetch suggest until the user types again. */
  const suppressSuggestUntilEditRef = useRef(false);

  function handleQueryChange(value: string) {
    suppressSuggestUntilEditRef.current = false;
    setQuery(value);
    setSelectedCity(null);
    setCities([]);
    setError(null);
    if (value.trim().length <= 7) {
      setHintCenter(null);
    }
  }

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setHintCenter(null);
      return;
    }
    if (suppressSuggestUntilEditRef.current) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    if (selectedCity && trimmed === selectedCity.city.trim()) {
      setSuggestions([]);
      return;
    }

    const handle = setTimeout(() => {
      const requestId = ++suggestRequestId.current;
      void (async () => {
        setLoadingSuggest(true);
        try {
          const nextSuggestions = await fetchYandexSuggestAddresses(trimmed);
          if (requestId !== suggestRequestId.current) return;
          setSuggestions(nextSuggestions);
          if (trimmed.length > 7) {
            const coords = await fetchYandexGeocodeCenter(trimmed);
            if (requestId !== suggestRequestId.current) return;
            setHintCenter(coords);
          } else {
            setHintCenter(null);
          }
        } finally {
          if (requestId === suggestRequestId.current) {
            setLoadingSuggest(false);
          }
        }
      })();
    }, 400);

    return () => clearTimeout(handle);
  }, [query, selectedCity]);

  async function handleSuggestionPick(formatted: string) {
    suggestRequestId.current += 1;
    suppressSuggestUntilEditRef.current = true;
    setLoadingSuggest(false);
    setSuggestions([]);
    setQuery(formatted);
    setSelectedCity(null);
    setCities([]);
    setLoadingCities(true);
    setError(null);
    try {
      const list = await resolveCdekCitiesFromFormatted(formatted);
      if (list.length === 1) {
        setSelectedCity(list[0]);
        setQuery(list[0].city);
        setCities([]);
      } else if (list.length > 1) {
        setCities(list);
      } else {
        setError(t('cdek.errors.cityNotFound'));
      }
    } catch (e) {
      console.error('CDEK city resolve:', e);
      setError(t('cdek.errors.resolveFailed'));
    } finally {
      setLoadingCities(false);
    }
  }

  useEffect(() => {
    onChange(null);
    setError(null);
    setQuote(null);
    setPoints([]);
    setSelectedPointCode('');
    if (!selectedCity) return;

    let cancelled = false;
    setLoadingQuote(true);
    setLoadingPoints(true);

    void Promise.all([
      fetch('/api/delivery/cdek/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode: selectedCity.code, parcels }),
      }),
      fetch('/api/delivery/cdek/pickup-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityCode: selectedCity.code }),
      }),
    ])
      .then(async ([qRes, pRes]) => {
        if (cancelled) return;
        if (!qRes.ok || !pRes.ok) throw new Error('load');
        const q = (await qRes.json()) as { tariffCode: number; cdekPrice: number };
        const p = (await pRes.json()) as CdekPickupPoint[];
        setQuote(q);
        setPoints(p);
        setHintCenter(null);
        if (p.length === 0) {
          setError(t('cdek.errors.noPickupPoints'));
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('cdek.errors.loadFailed'));
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingQuote(false);
          setLoadingPoints(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCity, parcels, onChange, t]);

  const selectedPoint = useMemo(
    () => points.find((point) => point.code === selectedPointCode) ?? null,
    [points, selectedPointCode]
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
          {t('cdek.addressLabel')}
        </label>
        <input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t('cdek.addressPlaceholder')}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-colors"
        />
        {loadingSuggest && query.trim().length > 0 && (
          <p className="mt-2 text-xs text-stone-500">{t('cdek.suggestLoading')}</p>
        )}
        {loadingCities && !loadingSuggest && (
          <p className="mt-2 text-xs text-stone-500">{t('cdek.resolvingCity')}</p>
        )}
        {suggestions.length > 0 && !selectedCity && cities.length === 0 && (
          <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden">
            {suggestions.map((line) => (
              <button
                key={line}
                type="button"
                onClick={() => void handleSuggestionPick(line)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0 text-stone-800"
              >
                {line}
              </button>
            ))}
          </div>
        )}
        {cities.length > 0 && !selectedCity && (
          <div className="mt-2 border border-stone-200 rounded-xl overflow-hidden">
            <p className="px-3 py-2 text-xs text-stone-500 bg-stone-50 border-b border-stone-100">
              {t('cdek.multiCityTitle')}
            </p>
            {cities.map((city) => (
              <button
                key={city.code}
                type="button"
                onClick={() => {
                  suggestRequestId.current += 1;
                  suppressSuggestUntilEditRef.current = true;
                  setLoadingSuggest(false);
                  setSuggestions([]);
                  setSelectedCity(city);
                  setQuery(city.city);
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
      </div>

      {selectedCity && (
        <CdekPickupSelector
          points={points}
          selectedCode={selectedPointCode}
          onSelect={setSelectedPointCode}
          loading={loadingPoints}
          error={!loadingPoints ? error : null}
          hintCenter={hintCenter}
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
