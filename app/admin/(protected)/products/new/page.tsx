import { createProduct } from '../../_actions/products';
import ProductForm from '../../_components/ProductForm';

export default function NewProductPage() {
  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <a href="/admin/products" className="text-sm text-stone-400 hover:text-rose-600 transition-colors">
          ← Back to Products
        </a>
        <h1 className="text-2xl font-bold text-stone-900 mt-2">New Product</h1>
      </div>
      <ProductForm action={createProduct} submitLabel="Create Product" />
    </div>
  );
}
