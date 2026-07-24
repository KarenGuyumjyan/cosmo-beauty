import Link from 'next/link';
import { createCategory } from '@/app/admin/_actions/categories';
import CategoryForm from '@/app/admin/_components/CategoryForm';

export default function NewCategoryPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/categories"
          className="text-sm text-stone-400 hover:text-rose-600 transition-colors"
        >
          ← К списку категорий
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">Новая категория</h1>
      </div>
      <CategoryForm action={createCategory} submitLabel="Создать категорию" />
    </div>
  );
}
