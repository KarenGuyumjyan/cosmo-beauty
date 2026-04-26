import type { OrderStatus, Product } from '@prisma/client';

/**
 * Order row with line items and product rows — matches prisma.order.findFirst/findUnique
 * with `include: { items: { include: { product: true } } }`.
 *
 * Kept explicit (not only Prisma inference) so editors stay correct if @prisma/client
 * types lag behind schema until `npx prisma generate` is run.
 */
export type OrderItemWithProduct = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product: Product;
};

export type OrderWithItemsAndProduct = {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string | null;
  city: string | null;
  cityCode: number | null;
  shippingMethod: string;
  pickupPointCode: string | null;
  pickupPointName: string | null;
  pickupPointAddress: string | null;
  tariffCode: number | null;
  cdekPrice: number | null;
  finalPrice: number | null;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  yookassaId: string | null;
  yookassaStatus: string | null;
  cdekUuid: string | null;
  cdekTrackingNumber: string | null;
  createdAt: Date;
  items: OrderItemWithProduct[];
};
