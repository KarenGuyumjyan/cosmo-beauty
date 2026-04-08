import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { updateProduct } from '../../../../_actions/products';
import ProductForm from '../../../../_components/ProductForm';

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const action = updateProduct.bind(null, id);

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <Link href="/admin/products" className="text-sm text-stone-400 hover:text-rose-600 transition-colors">
          ← Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">Edit Product</h1>
        <p className="text-stone-400 text-sm">{product.nameEn}</p>
      </div>
      <ProductForm action={action} product={product} submitLabel="Save Changes" />
    </div>
  );
}
