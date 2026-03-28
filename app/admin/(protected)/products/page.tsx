import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { categories } from '@/lib/data';
import DeleteProductButton from '../../_components/DeleteProductButton';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'asc' } });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Products</h1>
          <p className="text-stone-500 text-sm mt-1">{products.length} products total</p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                <th className="text-left px-6 py-3">Product</th>
                <th className="text-left px-6 py-3">Category</th>
                <th className="text-left px-6 py-3">Price</th>
                <th className="text-left px-6 py-3">SKU</th>
                <th className="text-left px-6 py-3">Stock</th>
                <th className="text-left px-6 py-3">Flags</th>
                <th className="text-right px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {products.map((p) => {
                const catLabel = categories.find((c) => c.value === p.category)?.label.en ?? p.category;
                return (
                  <tr key={p.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.images[0]} alt={p.nameEn} className="w-10 h-10 rounded-lg object-cover bg-stone-100" />
                        )}
                        <div>
                          <p className="font-medium text-stone-800">{p.nameEn}</p>
                          <p className="text-xs text-stone-400">{p.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-stone-500 capitalize">{catLabel}</td>
                    <td className="px-6 py-4 font-medium">
                      {p.discountedPrice ? (
                        <span>
                          <span className="text-rose-600">{p.discountedPrice.toLocaleString()}</span>
                          <span className="text-stone-400 line-through ml-1.5 text-xs">{p.price.toLocaleString()}</span>
                        </span>
                      ) : (
                        p.price.toLocaleString()
                      )}
                    </td>
                    <td className="px-6 py-4 text-stone-400 font-mono text-xs">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${p.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {p.featured && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">Featured</span>}
                        {p.bestseller && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">Best</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${p.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-rose-600 px-3 py-1.5 border border-stone-200 rounded-lg hover:border-rose-300 transition-colors"
                        >
                          <Pencil size={13} /> Edit
                        </Link>
                        <DeleteProductButton productId={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
