'use client';

import { OrderStatus } from '@prisma/client';
import { updateOrderStatus } from '../_actions/orders';
import { useState } from 'react';
import { orderStatusLabelRu } from '../_lib/order-status-ru';

const STATUSES = Object.values(OrderStatus);

export default function OrderStatusForm({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateOrderStatus(orderId, status);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Не удалось обновить статус. Попробуйте снова.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus); setSaved(false); }}
          className="input w-auto"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{orderStatusLabelRu[s]}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || status === current}
          className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          {saving ? 'Сохранение…' : saved ? '✓ Сохранено' : 'Обновить статус'}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
