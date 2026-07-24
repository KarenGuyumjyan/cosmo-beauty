import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { updateCategory } from '@/app/admin/_actions/categories';
import CategoryForm from '@/app/admin/_components/CategoryForm';

type Props = { params: Promise<{ slug: string }> };

export default async function EditCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) notFound();

  const action = updateCategory.bind(null, slug);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/categories" className="text-sm text-stone-400 hover:text-rose-600 transition-colors">
          ← К списку категорий
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">Редактирование категории</h1>
        <p className="text-stone-400 text-sm">{category.nameRu}</p>
      </div>
      <CategoryForm action={action} category={category} submitLabel="Сохранить" />
    </div>
  );
}
