'use client';

import { useState } from 'react';
import { deleteProduct } from '../_actions/products';

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!confirm('Delete this product?')) return;
    setDeleting(true);
    setError('');
    try {
      await deleteProduct(productId);
    } catch {
      setError('Delete failed.');
      setDeleting(false);
    }
  }

  return (
    <span className="relative">
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-xs font-medium text-stone-400 hover:text-red-600 disabled:opacity-50 px-3 py-1.5 border border-stone-200 rounded-lg hover:border-red-200 transition-colors"
      >
        {deleting ? 'Deleting…' : 'Delete'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
