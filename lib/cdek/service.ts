import { cdekRequest } from './client';
import type {
  CdekCity,
  CdekCreateOrderResult,
  CdekParcel,
  CdekPickupPoint,
  CdekQuoteResult,
} from './types';

const DEFAULT_TARIFF_CODE = 136;
const SENDER_CITY_CODE = parseInt(process.env.CDEK_SENDER_CITY_CODE ?? '44', 10);
const SENDER_NAME = process.env.CDEK_SENDER_NAME ?? 'Morena Cosmetics';
const SENDER_PHONE = process.env.CDEK_SENDER_PHONE ?? '+79999999999';
const SENDER_ADDRESS = process.env.CDEK_SENDER_ADDRESS ?? 'Sender warehouse';

type CdekCityApiRow = {
  code: number;
  city: string;
  region?: string;
  country?: string;
};

type CdekPickupApiRow = {
  code: string;
  name: string;
  address?: string;
  work_time?: string;
  phones?: Array<{ number?: string }>;
  location?: {
    city?: string;
    city_code?: number;
    address_full?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
};

export async function searchCities(query: string): Promise<CdekCity[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    country_codes: 'RU',
    size: '20',
    city: q,
  });

  const rows = await cdekRequest<CdekCityApiRow[]>(
    `location/cities?${params.toString()}`
  );

  return rows.map((row) => ({
    code: row.code,
    city: row.city,
    region: row.region,
    country: row.country,
  }));
}

export async function getPickupPoints(cityCode: number): Promise<CdekPickupPoint[]> {
  const rows = await cdekRequest<CdekPickupApiRow[]>(
    `/deliverypoints?type=PVZ&city_code=${cityCode}`
  );
  return rows.map((row) => ({
    code: row.code,
    name: row.name,
    address:
      row.location?.address_full ?? row.location?.address ?? row.address ?? '',
    city: row.location?.city ?? '',
    locationCode: row.location?.city_code,
    latitude: row.location?.latitude,
    longitude: row.location?.longitude,
    workTime: row.work_time,
    phones: row.phones
      ?.map((p) => p.number)
      .filter((v): v is string => Boolean(v)),
  }));
}

export async function calculateQuote(
  cityCode: number,
  parcels: CdekParcel[]
): Promise<CdekQuoteResult> {
  const quote = await cdekRequest<{
    total_sum?: number;
    tariff_code?: number;
  }>('/calculator/tariff', {
    method: 'POST',
    body: JSON.stringify({
      from_location: { code: SENDER_CITY_CODE },
      to_location: { code: cityCode },
      tariff_code: DEFAULT_TARIFF_CODE,
      packages: parcels,
    }),
  });

  return {
    tariffCode: quote.tariff_code ?? DEFAULT_TARIFF_CODE,
    cdekPrice: Math.round(quote.total_sum ?? 0),
  };
}

type CreateCdekOrderInput = {
  orderNumber: string;
  cityCode: number;
  pickupPointCode: string;
  tariffCode: number;
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string | null;
  parcels: CdekParcel[];
};

export async function createCdekOrder(input: CreateCdekOrderInput): Promise<CdekCreateOrderResult> {
  const payload = {
    number: input.orderNumber,
    tariff_code: input.tariffCode,
    from_location: { code: SENDER_CITY_CODE, address: SENDER_ADDRESS },
    to_location: { code: input.cityCode },
    delivery_point: input.pickupPointCode,
    recipient: {
      name: input.recipientName,
      phones: [{ number: input.recipientPhone }],
      email: input.recipientEmail ?? undefined,
    },
    sender: {
      name: SENDER_NAME,
      phones: [{ number: SENDER_PHONE }],
    },
    packages: input.parcels.map((p, idx) => ({
      number: `${input.orderNumber}-${idx + 1}`,
      weight: p.weight,
      length: p.length,
      width: p.width,
      height: p.height,
      items: [],
    })),
  };

  const raw = await cdekRequest<{
    entity?: { uuid?: string };
    requests?: Array<{ state?: string; errors?: unknown[] }>;
  }>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const uuid = raw.entity?.uuid ?? null;
  let trackingNumber: string | null = null;
  if (uuid) {
    const details = await cdekRequest<{ entity?: { cdek_number?: string } }>(`/orders/${uuid}`);
    trackingNumber = details.entity?.cdek_number ?? null;
  }

  return {
    uuid,
    trackingNumber,
    rawResponse: raw,
  };
}
