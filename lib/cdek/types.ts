export type CdekCity = {
  code: number;
  city: string;
  region?: string;
  country?: string;
  country_code?: string;
};

export type CdekPickupPoint = {
  code: string;
  name: string;
  address: string;
  city: string;
  locationCode?: number;
  latitude?: number;
  longitude?: number;
  workTime?: string;
  phones?: string[];
};

export type CdekParcel = {
  weight: number;
  length: number;
  width: number;
  height: number;
};

export type CdekQuoteResult = {
  tariffCode: number;
  cdekPrice: number;
};

export type CdekDeliverySelection = {
  city: string;
  cityCode: number;
  pickupPointCode: string;
  pickupPointName: string;
  pickupPointAddress: string;
  tariffCode: number;
  cdekPrice: number;
  finalPrice: number;
};

/**
 * Delivery method chosen at checkout. CDEK carries a full pickup-point
 * selection; SHOP_PICKUP is a free in-store pickup with no shipping data.
 * (Yandex pickup will be added later as another CDEK-like variant.)
 */
export type DeliverySelection =
  | { method: 'CDEK_PICKUP'; cdek: CdekDeliverySelection }
  | { method: 'SHOP_PICKUP' };

export type CdekCreateOrderResult = {
  uuid: string | null;
  trackingNumber: string | null;
  rawResponse: unknown;
};
