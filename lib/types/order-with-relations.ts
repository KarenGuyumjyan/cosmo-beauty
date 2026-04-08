import type { OrderStatus, Product, ShippingMethod } from '@prisma/client';

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
  shippingMethod: ShippingMethod;
  shippingCost: number;
  subtotal: number;
  total: number;
  status: OrderStatus;
  yookassaId: string | null;
  yookassaStatus: string | null;
  createdAt: Date;
  items: OrderItemWithProduct[];
};
