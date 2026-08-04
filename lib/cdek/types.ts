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

export type CdekPackageItem = {
  name: string;
  ware_key: string;
  cost: number;
  weight: number;
  amount: number;
};

export type CdekParcel = {
  weight: number;
  length: number;
  width: number;
  height: number;
  items?: CdekPackageItem[];
};

export type CdekQuoteResult = {
  tariffCode: number;
  cdekPrice: number;
  /** Estimated delivery window in working days, when CDEK returns it. */
  periodMin?: number;
  periodMax?: number;
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
 * CDEK courier delivery (tariff 137, склад-дверь). Unlike pickup-point
 * delivery there is no PVZ code - CDEK needs the recipient's street address.
 */
export type CdekCourierSelection = {
  city: string;
  cityCode: number;
  /** Street and house only - the apartment and friends live in their own fields. */
  address: string;
  /** Apartment or office number. Optional: private houses have none. */
  apartment?: string;
  entrance?: string;
  floor?: string;
  tariffCode: number;
  cdekPrice: number;
  finalPrice: number;
  periodMin?: number;
  periodMax?: number;
};

/**
 * Delivery method chosen at checkout.
 *  - CDEK_PICKUP  pickup point (tariff 136), free above MINIMUM_ORDER_AMOUNT
 *  - CDEK_COURIER courier to the door (tariff 137), always paid
 *  - SHOP_PICKUP  free in-store pickup, no shipping data
 * (Yandex pickup will be added later as another CDEK-like variant.)
 */
export type DeliverySelection =
  | { method: 'CDEK_PICKUP'; cdek: CdekDeliverySelection }
  | { method: 'CDEK_COURIER'; cdek: CdekCourierSelection }
  | { method: 'SHOP_PICKUP' };

export type CdekCreateOrderResult = {
  uuid: string | null;
  trackingNumber: string | null;
  rawResponse: unknown;
};
