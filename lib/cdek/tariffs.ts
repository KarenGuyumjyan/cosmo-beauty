/**
 * CDEK tariff codes used by the shop.
 *
 * The two differ structurally, not just in price:
 *  - 136 (склад-склад) delivers to a pickup point and requires `delivery_point`
 *  - 137 (склад-дверь) delivers to the customer's door and requires
 *    `to_location.address` instead
 *
 * See https://apidoc.cdek.ru/#tag/order
 */
export const CDEK_TARIFF_PVZ = 136;
export const CDEK_TARIFF_COURIER = 137;

/**
 * Courier delivery is always paid: it is never covered by the free-shipping
 * threshold that applies to pickup-point delivery.
 */
export const ALWAYS_PAID_TARIFFS: readonly number[] = [CDEK_TARIFF_COURIER];

/** True when this tariff must always be charged, regardless of order total. */
export function isAlwaysPaidTariff(tariffCode: number | null | undefined): boolean {
  return tariffCode != null && ALWAYS_PAID_TARIFFS.includes(tariffCode);
}
