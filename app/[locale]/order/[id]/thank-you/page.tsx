import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import { fetchPayment } from '@/lib/yookassa';
import type { Metadata } from 'next';
import ThankYouClient from './ThankYouClient';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'thankYou' });
  return { title: t('title') };
}

export default async function ThankYouPage({ params }: Props) {
  const { locale, id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  });

  if (!order) notFound();

  // If order is still PENDING and has a yookassaId, check payment status directly
  if (order.status === 'PENDING' && order.yookassaId) {
    try {
      const payment = await fetchPayment(order.yookassaId);
      if (payment && payment.status === 'succeeded') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'PAID', yookassaStatus: 'succeeded' },
        });
        order.status = 'PAID';
      } else if (payment && payment.status === 'canceled') {
        await prisma.order.update({
          where: { id: order.id },
          data: { status: 'CANCELLED', yookassaStatus: 'canceled' },
        });
        order.status = 'CANCELLED';
      }
    } catch (e) {
      console.error('Failed to check payment status:', e);
    }
  }

  const serialized = {
    id: order.id,
    status: order.status,
    shippingMethod: order.shippingMethod,
    shippingCost: order.shippingCost,
    subtotal: order.subtotal,
    total: order.total,
    items: order.items.map((i) => ({
      id: i.id,
      name: locale === 'ru' ? i.product.nameRu : locale === 'hy' ? i.product.nameHy : i.product.nameEn,
      quantity: i.quantity,
      price: i.price,
      image: i.product.images[0] ?? '',
    })),
  };

  return <ThankYouClient order={serialized} />;
}
