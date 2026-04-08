import { prisma } from '@/lib/prisma';
import { Package, ShoppingBag, Mail, TrendingUp } from 'lucide-react';
import Link from 'next/link';

async function getStats() {
  const [productCount, orderCount, pendingCount, contactCount, revenue, recentOrders] =
    await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.contactApplication.count(),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.order.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      }),
    ]);

  return { productCount, orderCount, pendingCount, contactCount, revenue, recentOrders };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:   'bg-yellow-100 text-yellow-800',
  PAID:      'bg-blue-100 text-blue-800',
  SHIPPED:   'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default async function AdminDashboard() {
  const { productCount, orderCount, pendingCount, contactCount, revenue, recentOrders } =
    await getStats();

  const stats = [
    { label: 'Products',       value: productCount,                           icon: Package,     href: '/admin/products', color: 'text-rose-600',   bg: 'bg-rose-50' },
    { label: 'Total Orders',   value: orderCount,                             icon: ShoppingBag, href: '/admin/orders',   color: 'text-blue-600',   bg: 'bg-blue-50' },
    { label: 'Revenue (paid)', value: `${(revenue._sum.total ?? 0).toLocaleString()} ₽`, icon: TrendingUp,  href: '/admin/orders',   color: 'text-green-600',  bg: 'bg-green-50' },
    { label: 'Contacts',       value: contactCount,                           icon: Mail,        href: '/admin/contacts', color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
        <p className="text-stone-500 text-sm mt-1">Welcome back. Here&apos;s what&apos;s happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl border border-stone-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={20} className={color} />
              </div>
              {label === 'Total Orders' && pendingCount > 0 && (
                <span className="text-xs font-bold bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  {pendingCount} pending
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-stone-900">{value}</p>
            <p className="text-stone-500 text-sm mt-0.5">{label}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-stone-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-rose-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider border-b border-stone-100">
                  <th className="text-left px-6 py-3">Customer</th>
                  <th className="text-left px-6 py-3">Items</th>
                  <th className="text-left px-6 py-3">Total</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-800">{order.customerName}</td>
                    <td className="px-6 py-4 text-stone-500">{order.items.length} item(s)</td>
                    <td className="px-6 py-4 font-medium">{order.total.toLocaleString()} ₽</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-stone-400">
                      {new Date(order.createdAt).toLocaleDateString()}
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
