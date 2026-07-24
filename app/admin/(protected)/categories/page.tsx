import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getCategoriesForAdmin } from '@/lib/categories';
import DeleteCategoryButton from '../../_components/DeleteCategoryButton';

export default async function AdminCategoriesPage() {
  const categories = await getCategoriesForAdmin();
  const counts = await prisma.product.groupBy({
    by: ['category'],
    _count: { _all: true },
  });
  const countBySlug = new Map(counts.map((c) => [c.category, c._count._all]));

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Категории</h1>
          <p className="text-stone-500 text-sm mt-1">Всего категорий: {categories.length}</p>
        </div>
        <Link
          href="/admin/categories/new"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <Plus size={16} /> Добавить категорию
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-medium text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100">
                <th className="text-left px-6 py-3">Название (RU)</th>
                <th className="text-left px-6 py-3">Slug</th>
                <th className="text-left px-6 py-3">Префикс</th>
                <th className="text-left px-6 py-3">Товаров</th>
                <th className="text-right px-6 py-3">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {categories.map((c) => (
                <tr key={c.slug} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-stone-800">{c.nameRu}</td>
                  <td className="px-6 py-4 text-stone-400 font-mono text-xs">{c.slug}</td>
                  <td className="px-6 py-4 text-stone-500 font-mono text-xs">{c.skuPrefix}</td>
                  <td className="px-6 py-4 text-stone-500">{countBySlug.get(c.slug) ?? 0}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/categories/${c.slug}/edit`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-rose-600 px-3 py-1.5 border border-stone-200 rounded-lg hover:border-rose-300 transition-colors"
                      >
                        <Pencil size={13} /> Изменить
                      </Link>
                      <DeleteCategoryButton slug={c.slug} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
