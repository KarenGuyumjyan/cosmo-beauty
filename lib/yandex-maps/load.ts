export type YMapsApi = {
  ready: (cb: () => void) => void;
  Map: new (
    container: HTMLElement,
    state: { center: [number, number]; zoom: number; controls?: string[] },
    options?: Record<string, unknown>
  ) => YMap;
  Placemark: new (
    coordinates: [number, number],
    properties?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => YPlacemark;
  Clusterer: new (options?: Record<string, unknown>) => YClusterer;
  geoQuery?: (data: unknown) => unknown;
  util: {
    bounds: {
      fromPoints: (points: Array<[number, number]>) => [[number, number], [number, number]];
    };
  };
};

export type YMap = {
  geoObjects: {
    add: (obj: unknown) => void;
    remove: (obj: unknown) => void;
    removeAll: () => void;
  };
  setBounds: (
    bounds: [[number, number], [number, number]],
    options?: { checkZoomRange?: boolean; zoomMargin?: number }
  ) => Promise<void>;
  setCenter: (
    center: [number, number],
    zoom?: number,
    options?: { duration?: number }
  ) => Promise<void>;
  panTo: (center: [number, number], options?: { duration?: number }) => Promise<void>;
  destroy: () => void;
  container: { fitToViewport: () => void };
};

export type YPlacemark = {
  geometry: { getCoordinates: () => [number, number] };
  options: { set: (key: string, value: unknown) => void };
  properties: { get: (key: string) => unknown };
  events: { add: (type: string, handler: () => void) => void };
};

export type YClusterer = {
  add: (objects: YPlacemark[]) => void;
  removeAll: () => void;
  getGeoObjects: () => YPlacemark[];
};

declare global {
  interface Window {
    ymaps?: YMapsApi;
  }
}

let loadPromise: Promise<YMapsApi> | null = null;

export function loadYandexMaps(apiKey: string, lang = 'ru_RU'): Promise<YMapsApi> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Yandex Maps can only be loaded in the browser'));
  }
  if (window.ymaps && typeof window.ymaps.ready === 'function') {
    const api = window.ymaps;
    return new Promise((resolve) => api.ready(() => resolve(api)));
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-yandex-maps="1"]'
    );
    const script = existing ?? document.createElement('script');
    if (!existing) {
      script.dataset.yandexMaps = '1';
      script.src = `https://api-maps.yandex.ru/2.1/?apikey=${encodeURIComponent(
        apiKey
      )}&lang=${encodeURIComponent(lang)}`;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', () => {
      const api = window.ymaps;
      if (!api) {
        reject(new Error('Yandex Maps loaded but window.ymaps is missing'));
        return;
      }
      api.ready(() => resolve(api));
    });
    script.addEventListener('error', () => {
      loadPromise = null;
      reject(new Error('Failed to load Yandex Maps'));
    });
  });

  return loadPromise;
}
