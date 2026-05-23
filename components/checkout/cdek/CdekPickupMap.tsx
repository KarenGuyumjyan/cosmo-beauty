'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import type { CdekPickupPoint } from '@/lib/cdek/types';
import {
  loadYandexMaps,
  type YMap,
  type YMapsApi,
  type YClusterer,
  type YPlacemark,
} from '@/lib/yandex-maps/load';

type Props = {
  points: CdekPickupPoint[];
  selectedCode: string;
  onSelect: (code: string) => void;
  /** Optional map center while pickup points are still loading (from geocoder). */
  hintCenter?: [number, number] | null;
};

const DEFAULT_CENTER: [number, number] = [55.751244, 37.618423];
const DEFAULT_ZOOM = 10;

const MAP_API_KEY_MISSING = '__MAP_API_KEY_MISSING__';

export default function CdekPickupMap({
  points,
  selectedCode,
  onSelect,
  hintCenter,
}: Props) {
  const t = useTranslations('checkout');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<YMap | null>(null);
  const apiRef = useRef<YMapsApi | null>(null);
  const clustererRef = useRef<YClusterer | null>(null);
  const placemarksRef = useRef<Map<string, YPlacemark>>(new Map());
  const onSelectRef = useRef(onSelect);

  // Compute the missing-key error during render so React doesn't have to
  // schedule a cascading setState from inside an effect.
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;
  const [apiError, setApiError] = useState<string | null>(
    apiKey ? null : MAP_API_KEY_MISSING,
  );
  const [loading, setLoading] = useState<boolean>(Boolean(apiKey));

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!apiKey) return;

    let disposed = false;
    // Capture the Map instance once at effect creation time so the cleanup
    // function clears the exact same collection that was populated by this
    // effect's render scope, not a future render's swapped-in instance.
    const placemarks = placemarksRef.current;

    loadYandexMaps(apiKey)
      .then((api) => {
        if (disposed || !containerRef.current) return;
        apiRef.current = api;
        mapRef.current = new api.Map(
          containerRef.current,
          {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            controls: ['zoomControl'],
          },
          { suppressMapOpenBlock: true },
        );
        setLoading(false);
      })
      .catch((e: Error) => {
        if (disposed) return;
        setApiError(e.message);
        setLoading(false);
      });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
      clustererRef.current = null;
      placemarks.clear();
    };
  }, [apiKey]);

  useEffect(() => {
    const api = apiRef.current;
    const map = mapRef.current;
    if (!api || !map) return;

    if (clustererRef.current) {
      map.geoObjects.remove(clustererRef.current);
      clustererRef.current = null;
    }
    placemarksRef.current.clear();

    const withCoords = points.filter(
      (p): p is CdekPickupPoint & { latitude: number; longitude: number } =>
        typeof p.latitude === 'number' && typeof p.longitude === 'number'
    );
    if (withCoords.length === 0) return;

    const clusterer = new api.Clusterer({
      preset: 'islands#invertedRedClusterIcons',
      groupByCoordinates: false,
      clusterDisableClickZoom: false,
      clusterHideIconOnBalloonOpen: false,
      geoObjectHideIconOnBalloonOpen: false,
    });

    const placemarks = withCoords.map((point) => {
      const placemark = new api.Placemark(
        [point.latitude, point.longitude],
        { pointCode: point.code },
        {
          preset:
            point.code === selectedCode
              ? 'islands#blueCircleDotIcon'
              : 'islands#redCircleDotIcon',
        }
      );
      placemark.events.add('click', () => {
        onSelectRef.current(point.code);
      });
      placemarksRef.current.set(point.code, placemark);
      return placemark;
    });

    clusterer.add(placemarks);
    map.geoObjects.add(clusterer);
    clustererRef.current = clusterer;

    const coordinates: Array<[number, number]> = withCoords.map((p) => [
      p.latitude,
      p.longitude,
    ]);
    try {
      const bounds = api.util.bounds.fromPoints(coordinates);
      void map.setBounds(bounds, { checkZoomRange: true, zoomMargin: 40 });
    } catch {
      void map.setCenter(coordinates[0], DEFAULT_ZOOM);
    }
  }, [points, selectedCode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hintCenter) return;
    const withCoords = points.filter(
      (p) => typeof p.latitude === 'number' && typeof p.longitude === 'number'
    );
    if (withCoords.length > 0) return;
    void map.setCenter(hintCenter, 14);
  }, [hintCenter, points]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    placemarksRef.current.forEach((placemark, code) => {
      placemark.options.set(
        'preset',
        code === selectedCode
          ? 'islands#blueCircleDotIcon'
          : 'islands#redCircleDotIcon'
      );
    });
    if (!selectedCode) return;
    const placemark = placemarksRef.current.get(selectedCode);
    if (!placemark) return;
    const coords = placemark.geometry.getCoordinates();
    void map.panTo(coords, { duration: 300 });
  }, [selectedCode]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const ro = new ResizeObserver(() => map.container.fitToViewport());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="relative w-full h-[480px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-50">
      <div ref={containerRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/70">
          <Loader2 size={24} className="animate-spin text-rose-500" />
        </div>
      )}
      {apiError && (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-600 bg-white">
          {apiError === MAP_API_KEY_MISSING
            ? t('cdek.mapApiKeyMissing')
            : t('cdek.mapUnavailable', { reason: apiError })}
        </div>
      )}
    </div>
  );
}
