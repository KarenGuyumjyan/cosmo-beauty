'use client';

import { useState } from 'react';
import { deleteCategory } from '../_actions/categories';

export default function DeleteCategoryButton({ slug }: { slug: string }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    if (!confirm('Удалить эту категорию?')) return;
    setDeleting(true);
    setError('');
    try {
      const result = await deleteCategory(slug);
      if (result && typeof result === 'object' && 'error' in result) {
        setError(result.error);
        setDeleting(false);
      }
    } catch {
      setError('Не удалось удалить.');
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
        {deleting ? 'Удаление…' : 'Удалить'}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
