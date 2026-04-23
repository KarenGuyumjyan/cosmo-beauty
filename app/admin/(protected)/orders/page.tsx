import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { OrderStatus } from '@prisma/client';

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PAID:      'bg-blue-100   text-blue-800',
  SHIPPED:   'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100  text-green-800',
  CANCELLED: 'bg-red-100    text-red-800',
};

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { status } = await searchParams;
  const statusFilter = Object.values(OrderStatus).includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const orders = await prisma.order.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });

  const tabs: { label: string; value: string }[] = [
    { label: 'All', value: '' },
    ...Object.values(OrderStatus).map((s) => ({ label: s, value: s })),
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <p className="text-stone-500 text-sm mt-1">{orders.length} orders</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1 mb-6 bg-white border border-stone-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => {
          const active = (status ?? '') === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/orders?status=${tab.value}` : '/admin/orders'}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-rose-600 text-white' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">No orders found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                  <th className="text-left px-6 py-3">ID</th>
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Phone</th>
                  <th className="text-left px-6 py-3">Items</th>
                  <th className="text-left px-6 py-3">Total</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-right px-6 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-stone-400">{order.id.slice(0, 8)}…</td>
                    <td className="px-6 py-4 font-medium text-stone-800">{order.customerName}</td>
                    <td className="px-6 py-4 text-stone-500">{order.customerPhone}</td>
                    <td className="px-6 py-4 text-stone-500">{order.items.length}</td>
                    <td className="px-6 py-4 font-medium">{order.total.toLocaleString()} ₽</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
