import type { Product } from '@prisma/client';
import type { CdekParcel } from './types';

const DEFAULT_WEIGHT_GRAMS = 100;
const DEFAULT_LENGTH_CM = 15;
const DEFAULT_WIDTH_CM = 5;
const DEFAULT_HEIGHT_CM = 5;

type OrderLine = {
  quantity: number;
  product: Product;
};

// All lines of an order are packed into a SINGLE box (one order = one parcel).
// Weight is the sum of every item's weight; each box dimension is the largest
// dimension across all products, so the box is at least as big as the biggest
// item it contains.
export function buildParcelsFromOrderLines(lines: OrderLine[]): CdekParcel[] {
  if (lines.length === 0) return [];

  let totalWeight = 0;
  let length = DEFAULT_LENGTH_CM;
  let width = DEFAULT_WIDTH_CM;
  let height = DEFAULT_HEIGHT_CM;

  const items = lines.map((line) => {
    const { product } = line;

    const unitWeight = Math.max(1, product.weightGrams ?? DEFAULT_WEIGHT_GRAMS);
    const unitCost = product.discountedPrice ?? product.price;

    totalWeight += unitWeight * line.quantity;
    length = Math.max(length, product.lengthCm ?? DEFAULT_LENGTH_CM);
    width = Math.max(width, product.widthCm ?? DEFAULT_WIDTH_CM);
    height = Math.max(height, product.heightCm ?? DEFAULT_HEIGHT_CM);

    return {
      name: product.nameRu || product.nameEn,
      ware_key: product.id,
      cost: unitCost,
      weight: unitWeight,
      amount: line.quantity,
    };
  });

  return [
    {
      weight: Math.max(1, totalWeight),
      length: Math.max(1, length),
      width: Math.max(1, width),
      height: Math.max(1, height),
      items,
    },
  ];
}
