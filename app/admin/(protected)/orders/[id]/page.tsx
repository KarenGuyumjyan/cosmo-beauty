import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { OrderStatus } from '@prisma/client'
import type { OrderWithItemsAndProduct } from '@/lib/types/order-with-relations'
import OrderStatusForm from '@/app/admin/_components/OrderStatusForm'
import Link from 'next/link'

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-blue-100   text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100  text-green-800',
  CANCELLED: 'bg-red-100    text-red-800',
}

type Props = { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params
  const order = (await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } },
  })) as OrderWithItemsAndProduct | null
  if (!order) notFound()

  return (
    <div className='p-8 max-w-3xl'>
      <div className='mb-8'>
        <Link
          href='/admin/orders'
          className='text-sm text-stone-400 hover:text-rose-600 transition-colors'
        >
          ← Back to Orders
        </Link>
        <div className='flex items-center gap-3 mt-2'>
          <h1 className='text-2xl font-bold text-stone-900'>Order</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}
          >
            {order.status}
          </span>
        </div>
        <p className='text-stone-400 font-mono text-xs mt-1'>{order.id}</p>
      </div>

      {/* Customer info */}
      <div className='bg-white rounded-2xl border border-stone-100 p-6 mb-5'>
        <h2 className='font-semibold text-stone-900 mb-4'>Customer</h2>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-stone-400 text-xs mb-0.5'>Name</p>
            <p className='font-medium text-stone-800'>{order.customerName}</p>
          </div>
          <div>
            <p className='text-stone-400 text-xs mb-0.5'>Phone</p>
            <p className='font-medium text-stone-800'>{order.customerPhone}</p>
          </div>
          {order.customerEmail && (
            <div>
              <p className='text-stone-400 text-xs mb-0.5'>Email</p>
              <p className='font-medium text-stone-800'>
                {order.customerEmail}
              </p>
            </div>
          )}
          <div>
            <p className='text-stone-400 text-xs mb-0.5'>Date</p>
            <p className='font-medium text-stone-800'>
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className='bg-white rounded-2xl border border-stone-100 p-6 mb-5'>
        <h2 className='font-semibold text-stone-900 mb-4'>Shipping &amp; Payment</h2>
        <div className='grid grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-stone-400 text-xs mb-0.5'>Method</p>
            <p className='font-medium text-stone-800'>
              {order.shippingMethod === 'YANDEX_DELIVERY' ? 'Yandex Delivery' : 'Self-pickup'}
            </p>
          </div>
          <div>
            <p className='text-stone-400 text-xs mb-0.5'>Shipping Cost</p>
            <p className='font-medium text-stone-800'>
              {order.shippingCost > 0 ? `${order.shippingCost.toLocaleString()} ₽` : 'Free'}
            </p>
          </div>
          {order.address && (
            <div className='col-span-2'>
              <p className='text-stone-400 text-xs mb-0.5'>Address</p>
              <p className='font-medium text-stone-800'>
                {order.city ? `${order.city}, ` : ''}{order.address}
              </p>
            </div>
          )}
          {order.yookassaId && (
            <div>
              <p className='text-stone-400 text-xs mb-0.5'>YooKassa ID</p>
              <p className='font-medium text-stone-800 font-mono text-xs'>{order.yookassaId}</p>
            </div>
          )}
          {order.yookassaStatus && (
            <div>
              <p className='text-stone-400 text-xs mb-0.5'>Payment Status</p>
              <p className='font-medium text-stone-800'>{order.yookassaStatus}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className='bg-white rounded-2xl border border-stone-100 overflow-hidden mb-5'>
        <div className='px-6 py-4 border-b border-stone-100'>
          <h2 className='font-semibold text-stone-900'>Order Items</h2>
        </div>
        <table className='w-full text-sm'>
          <thead>
            <tr className='text-xs font-medium text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100'>
              <th className='text-left px-6 py-3'>Product</th>
              <th className='text-left px-6 py-3'>Qty</th>
              <th className='text-left px-6 py-3'>Unit Price</th>
              <th className='text-right px-6 py-3'>Subtotal</th>
            </tr>
          </thead>
          <tbody className='divide-y divide-stone-50'>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className='px-6 py-4 font-medium text-stone-800'>
                  {item.product.nameEn}
                </td>
                <td className='px-6 py-4 text-stone-500'>{item.quantity}</td>
                <td className='px-6 py-4 text-stone-500'>
                  {item.price.toLocaleString()} ₽
                </td>
                <td className='px-6 py-4 text-right font-medium'>
                  {(item.price * item.quantity).toLocaleString()} ₽
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {order.shippingCost > 0 && (
              <tr className='border-t border-stone-100'>
                <td colSpan={3} className='px-6 py-2 text-right text-sm text-stone-500'>Subtotal</td>
                <td className='px-6 py-2 text-right text-sm font-medium'>{order.subtotal.toLocaleString()} ₽</td>
              </tr>
            )}
            {order.shippingCost > 0 && (
              <tr>
                <td colSpan={3} className='px-6 py-2 text-right text-sm text-stone-500'>Shipping</td>
                <td className='px-6 py-2 text-right text-sm font-medium'>{order.shippingCost.toLocaleString()} ₽</td>
              </tr>
            )}
            <tr className='border-t border-stone-200'>
              <td colSpan={3} className='px-6 py-4 text-right font-semibold text-stone-700'>Total</td>
              <td className='px-6 py-4 text-right font-bold text-rose-600 text-base'>
                {order.total.toLocaleString()} ₽
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Status update */}
      <div className='bg-white rounded-2xl border border-stone-100 p-6'>
        <h2 className='font-semibold text-stone-900 mb-4'>Update Status</h2>
        <OrderStatusForm orderId={order.id} current={order.status} />
      </div>
    </div>
  )
}
