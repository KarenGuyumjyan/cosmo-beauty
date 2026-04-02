import { createProduct } from '@/app/admin/_actions/products'
import ProductForm from '@/app/admin/_components/ProductForm'
import { Link } from '@/i18n/navigation'

export default function NewProductPage() {
  return (
    <div className='p-8 max-w-4xl'>
      <div className='mb-8'>
        <Link
          href='/admin/products'
          className='text-sm text-stone-400 hover:text-rose-600 transition-colors'
        >
          ← Back to Products
        </Link>
        <h1 className='text-2xl font-bold text-stone-900 mt-2'>New Product</h1>
      </div>
      <ProductForm action={createProduct} submitLabel='Create Product' />
    </div>
  )
}
