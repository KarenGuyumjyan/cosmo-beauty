import type { CdekCourierSelection } from './types';

type AddressParts = Pick<
  CdekCourierSelection,
  'address' | 'apartment' | 'entrance' | 'floor'
>;

/**
 * Collapse the courier address fields into the single line CDEK stores as
 * `to_location.address` and prints on the waybill.
 *
 * The qualifiers are always Russian regardless of the shop locale - the person
 * reading them is a courier in Russia, not the customer.
 */
export function formatCourierAddress({
  address,
  apartment,
  entrance,
  floor,
}: AddressParts): string {
  return [
    address.trim(),
    apartment?.trim() && `Квартира ${apartment.trim()}`,
    entrance?.trim() && `Подъезд ${entrance.trim()}`,
    floor?.trim() && `Этаж ${floor.trim()}`,
  ]
    .filter(Boolean)
    .join(', ');
}
