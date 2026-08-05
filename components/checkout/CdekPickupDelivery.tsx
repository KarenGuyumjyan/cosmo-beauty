'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MapPin } from 'lucide-react';
import type {
  CdekCity,
  CdekDeliverySelection,
  CdekParcel,
  CdekPickupPoint,
} from '@/lib/cdek/types';
import CdekCitySelect from '@/components/checkout/cdek/CdekCitySelect';
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

  const [selectedCity, setSelectedCity] = useState<CdekCity | null>(
    DEFAULT_CHECKOUT_CITY,
  );

  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingPoints, setLoadingPoints] = useState(true);
  const [quote, setQuote] = useState<{
    tariffCode: number;
    cdekPrice: number;
  } | null>(null);
  const [points, setPoints] = useState<CdekPickupPoint[]>([]);
  const [selectedPointCode, setSelectedPointCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCitySelect = useCallback((nextCity: CdekCity) => {
    setSelectedCity(nextCity);
    setError(null);
  }, []);

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
      <CdekCitySelect
        value={selectedCity}
        onChange={handleCitySelect}
        onError={setError}
      />

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
