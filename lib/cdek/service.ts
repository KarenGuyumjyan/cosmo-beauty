import { cdekRequest } from './client'
import { expandCdekCityQueries } from './translit'
import type {
  CdekCity,
  CdekCreateOrderResult,
  CdekParcel,
  CdekPickupPoint,
  CdekQuoteResult,
} from './types'

const DEFAULT_TARIFF_CODE = 136
const SENDER_CITY_CODE = parseInt(process.env.CDEK_SENDER_CITY_CODE ?? '44', 10)
const SENDER_NAME = process.env.CDEK_SENDER_NAME ?? 'Morena Cosmetics'
const SENDER_PHONE = process.env.CDEK_SENDER_PHONE ?? '+79999999999'
const SENDER_ADDRESS = process.env.CDEK_SENDER_ADDRESS ?? 'Sender warehouse'

type CdekCityApiRow = {
  code: number | string
  city: string
  region?: string
  country?: string
  country_code?: string
}

type CdekPickupApiRow = {
  code: string
  name: string
  address?: string
  work_time?: string
  phones?: Array<{ number?: string }>
  location?: {
    city?: string
    city_code?: number
    address_full?: string
    address?: string
    latitude?: number
    longitude?: number
  }
}

export async function searchCities(query: string): Promise<CdekCity[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const candidates = expandCdekCityQueries(q)
  const seen = new Set<number>()
  const results: CdekCity[] = []

  for (const candidate of candidates) {
    if (results.length >= 20) break

    // Try the suggest endpoint first (returns fast prefix-match results).
    // If it returns nothing, fall back to the standard cities listing endpoint.
    let rows: CdekCityApiRow[] = []
    let fetchError: unknown = null

    for (const attempt of [
      `/location/suggest/cities?name=${encodeURIComponent(candidate)}&country_code=RU`,
      `/location/cities?city=${encodeURIComponent(candidate)}&country_codes=RU&size=20`,
    ]) {
      try {
        const raw = await cdekRequest<unknown>(attempt)
        if (Array.isArray(raw)) {
          rows = raw as CdekCityApiRow[]
        } else if (raw && typeof raw === 'object') {
          // Some CDEK responses wrap the array: { cities: [...] }
          const asObj = raw as Record<string, unknown>
          const inner = asObj.cities ?? asObj.data ?? asObj.items
          rows = Array.isArray(inner) ? (inner as CdekCityApiRow[]) : []
        }
        console.log(`[CDEK cities] ${attempt} → ${rows.length} rows`)
        if (rows.length > 0) break
      } catch (err) {
        fetchError = err
        console.warn(
          `[CDEK cities] ${attempt} failed:`,
          err instanceof Error ? err.message : err,
        )
      }
    }

    if (rows.length === 0 && fetchError !== null && results.length === 0) {
      throw fetchError
    }

    for (const row of rows) {
      if (!row.city) continue
      const code = Number(row.code)
      if (!Number.isFinite(code) || code === 0) continue
      if (seen.has(code)) continue
      seen.add(code)
      results.push({
        code,
        city: row.city,
        region: row.region,
        country: row.country ?? row.country_code,
      })
      if (results.length >= 20) break
    }
  }

  return results
}

export async function getPickupPoints(
  cityCode: number,
): Promise<CdekPickupPoint[]> {
  const rows = await cdekRequest<CdekPickupApiRow[]>(
    `/deliverypoints?type=PVZ&city_code=${cityCode}`,
  )
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
  }))
}

export async function calculateQuote(
  cityCode: number,
  parcels: CdekParcel[],
  totalPrice: number,
): Promise<CdekQuoteResult> {
  const quote = await cdekRequest<{
    total_sum?: number
    tariff_code?: number
  }>('/calculator/tariff', {
    method: 'POST',
    body: JSON.stringify({
      from_location: { code: SENDER_CITY_CODE },
      to_location: { code: cityCode },
      tariff_code: DEFAULT_TARIFF_CODE,
      packages: parcels,
      services: [{ code: 'INSURANCE', parameter: totalPrice }],
    }),
  })

  return {
    tariffCode: quote.tariff_code ?? DEFAULT_TARIFF_CODE,
    cdekPrice: Math.round(quote.total_sum ?? 0),
  }
}

type CreateCdekOrderInput = {
  orderNumber: string
  cityCode: number
  pickupPointCode: string
  tariffCode: number
  recipientName: string
  recipientPhone: string
  recipientEmail?: string | null
  parcels: CdekParcel[]
}

export async function createCdekOrder(
  input: CreateCdekOrderInput,
): Promise<CdekCreateOrderResult> {
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
  }

  const raw = await cdekRequest<{
    entity?: { uuid?: string }
    requests?: Array<{ state?: string; errors?: unknown[] }>
  }>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const uuid = raw.entity?.uuid ?? null
  let trackingNumber: string | null = null
  if (uuid) {
    const details = await cdekRequest<{ entity?: { cdek_number?: string } }>(
      `/orders/${uuid}`,
    )
    trackingNumber = details.entity?.cdek_number ?? null
  }

  return {
    uuid,
    trackingNumber,
    rawResponse: raw,
  }
}
