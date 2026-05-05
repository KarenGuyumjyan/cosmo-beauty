const CLIENT_ID = process.env.CDEK_CLIENT_ID!
const SECRET = process.env.CDEK_CLIENT_SECRET!
const API_BASE = 'https://api.cdek.ru/v2'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: SECRET,
    }),
  })

  if (!res.ok) {
    throw new Error(`CDEK auth error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.token
}

/* ─── Request types ─── */

export interface CdekPhone {
  number: string
  additional?: string
}

export interface CdekContact {
  company?: string
  name: string
  contragent_type?: 'LEGAL_ENTITY' | 'INDIVIDUAL'
  passport_series?: string
  passport_number?: string
  passport_date_of_issue?: string
  passport_organization?: string
  tin?: string
  passport_date_of_birth?: string
  email?: string
  phones?: CdekPhone[]
}

export interface CdekSeller {
  name?: string
  inn?: string
  phone?: string
  ownership_form?: number
  address?: string
}

export interface CdekLocation {
  code?: number
  city_uuid?: string
  city?: string
  fias_guid?: string
  kladr_code?: string
  country_code?: string
  country?: string
  region?: string
  region_code?: number
  fias_region_guid?: string
  sub_region?: string
  longitude?: number
  latitude?: number
  time_zone?: string
  payment_limit?: number
  address?: string
  postal_code?: string
}

export interface CdekMoney {
  value: number
  vat_sum?: number
  vat_rate?: number
}

export interface CdekDeliveryRecipientCostAdv {
  threshold: number
  sum: number
  vat_sum?: number
  vat_rate?: number
}

export interface CdekService {
  code: string
  parameter?: number
}

export interface CdekItemSeller {
  name?: string
  inn?: string
  phone?: string
  ownership_form?: number
  address?: string
  giis_subdivision_id?: string
}

export interface CdekItem {
  name: string
  ware_key: string
  marking?: string
  payment?: CdekMoney
  weight: number
  weight_gross?: number
  amount: number
  name_i18n?: string
  brand?: string
  country_code?: string
  material?: number
  wifi_gsm?: boolean
  url?: string
  seller?: CdekItemSeller
  cost: number
  feacn_code?: string
  jewel_uin?: string
  used?: boolean
}

export interface CdekPackage {
  number: string
  weight: number
  length?: number
  width?: number
  height?: number
  comment?: string
  items?: CdekItem[]
  package_id?: string
}

export interface CreateCdekOrderParams {
  type?: number
  additional_order_types?: number[]
  number?: string
  accompanying_number?: string
  tariff_code: number
  comment?: string
  shipment_point?: string
  delivery_point?: string
  date_invoice?: string
  shipper_name?: string
  shipper_address?: string
  delivery_recipient_cost?: CdekMoney
  delivery_recipient_cost_adv?: CdekDeliveryRecipientCostAdv[]
  sender?: CdekContact
  seller?: CdekSeller
  recipient: CdekContact
  from_location?: CdekLocation
  to_location?: CdekLocation
  services?: CdekService[]
  packages: CdekPackage[]
  is_client_return?: boolean
  has_reverse_order?: boolean
  developer_key?: string
  print?: 'WAYBILL' | 'BARCODE'
  widget_token?: string
}

/* ─── Response types ─── */

export interface CdekError {
  code?: string
  additional_code?: string
  message?: string
}

export interface CdekWarning {
  code?: string
  message?: string
}

export interface CdekRequest {
  request_uuid?: string
  type?: string
  date_time?: string
  state: string
  errors?: CdekError[]
  warnings?: CdekWarning[]
}

export interface CdekRelatedEntity {
  uuid?: string
  type?: string
  url?: string
  create_time?: string
  cdek_number?: string
  date?: string
  time_from?: string
  time_to?: string
}

export interface CdekOrderResponse {
  entity: { uuid?: string }
  requests: CdekRequest[]
  related_entities?: CdekRelatedEntity[]
}

/* ─── API call ─── */

export async function createCdekOrder(
  params: CreateCdekOrderParams,
): Promise<CdekOrderResponse> {
  const token = await getAccessToken()

  const res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(params),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error(`CDEK ${res.status}: ${errBody}`)
  }

  return res.json()
}
