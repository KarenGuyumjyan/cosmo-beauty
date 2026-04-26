import type { CdekCity } from './types';

/**
 * CDEK location `code` 44 = Moscow (Russia). One canonical row for default checkout.
 * Pickup/quote use `cityCode`; the label is shown in the input.
 */
export const DEFAULT_CHECKOUT_CITY: CdekCity = {
  code: 44,
  city: 'Москва',
  region: 'г. Москва',
};
