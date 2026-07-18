import type { Product } from '@prisma/client';
import type { CdekParcel } from './types';

const DEFAULT_WEIGHT_GRAMS = 100;
const DEFAULT_LENGTH_CM = 20;
const DEFAULT_WIDTH_CM = 20;
const DEFAULT_HEIGHT_CM = 10;

type OrderLine = {
  quantity: number;
  product: Product;
};

export function buildParcelsFromOrderLines(lines: OrderLine[]): CdekParcel[] {
  return lines.map((line) => {
    const productAny = line.product as Product & {
      weightGrams?: number;
      lengthCm?: number;
      widthCm?: number;
      heightCm?: number;
    };

    const unitWeight = Math.max(1, productAny.weightGrams ?? DEFAULT_WEIGHT_GRAMS);
    const unitCost = productAny.discountedPrice ?? productAny.price;

    return {
      weight: unitWeight * line.quantity,
      length: Math.max(1, productAny.lengthCm ?? DEFAULT_LENGTH_CM),
      width: Math.max(1, productAny.widthCm ?? DEFAULT_WIDTH_CM),
      height: Math.max(1, productAny.heightCm ?? DEFAULT_HEIGHT_CM),
      items: [
        {
          name: productAny.nameRu || productAny.nameEn,
          ware_key: productAny.id,
          cost: unitCost,
          weight: unitWeight,
          amount: line.quantity,
        },
      ],
    };
  });
}
