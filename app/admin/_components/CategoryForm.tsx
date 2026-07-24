'use client';

import { useState } from 'react';
import Link from 'next/link';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import type { Category as DbCategory } from '@prisma/client';

interface CategoryFormProps {
  action: (formData: FormData) => Promise<void | { error: string }>;
  category?: DbCategory;
  submitLabel: string;
}

export default function CategoryForm({ action, category, submitLabel }: CategoryFormProps) {
  const v = category;
  const isEdit = Boolean(v);
  const [submitError, setSubmitError] = useState('');

  async function handleSubmit(formData: FormData) {
    setSubmitError('');
    try {
      const result = await action(formData);
      if (result && typeof result === 'object' && 'error' in result) {
        setSubmitError(result.error);
      }
    } catch (e) {
      if (isRedirectError(e)) throw e;
      setSubmitError('Что-то пошло не так. Попробуйте снова.');
    }
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h2 className="font-semibold text-stone-900 mb-5">Категория</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Системное имя (slug)</label>
            <input
              name="slug"
              required
              defaultValue={v?.slug}
              readOnly={isEdit}
              className={`input ${isEdit ? 'bg-stone-50 text-stone-500 cursor-not-allowed' : ''}`}
              placeholder="напр. lip_gloss"
              autoComplete="off"
            />
            <p className="text-xs text-stone-400 mt-1.5">
              {isEdit
                ? 'Системное имя изменить нельзя — оно связывает товары с категорией.'
                : 'Латиница, цифры и подчёркивания. Используется в ссылках и связке с товарами.'}
            </p>
          </div>
          <div>
            <label className="label">Префикс артикула</label>
            <input
              name="skuPrefix"
              required
              defaultValue={v?.skuPrefix}
              className="input uppercase"
              placeholder="напр. LG"
              maxLength={4}
              autoComplete="off"
            />
            <p className="text-xs text-stone-400 mt-1.5">
              2–4 символа. Артикулы будут вида CSM-{'{'}префикс{'}'}-001.
            </p>
          </div>
          <div>
            <label className="label">Название (RU)</label>
            <input name="nameRu" required defaultValue={v?.nameRu} className="input" placeholder="напр. Блеск для губ" />
          </div>
          <div>
            <label className="label">Название (EN)</label>
            <input name="nameEn" required defaultValue={v?.nameEn} className="input" placeholder="e.g. Lip Gloss" />
          </div>
          <div>
            <label className="label">Название (HY)</label>
            <input name="nameHy" required defaultValue={v?.nameHy} className="input" placeholder="напр. Շրթունքների փայլ" />
          </div>
          <div>
            <label className="label">Порядок сортировки</label>
            <input name="sortOrder" type="number" defaultValue={v?.sortOrder ?? 0} className="input" placeholder="0" />
            <p className="text-xs text-stone-400 mt-1.5">Меньше — выше в списках.</p>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {submitError}
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-8 py-3 rounded-xl transition-colors"
        >
          {submitLabel}
        </button>
        <Link
          href="/admin/categories"
          className="px-8 py-3 border border-stone-200 text-stone-600 font-medium rounded-xl hover:bg-stone-50 transition-colors"
        >
          Отмена
        </Link>
      </div>
    </form>
  );
}
