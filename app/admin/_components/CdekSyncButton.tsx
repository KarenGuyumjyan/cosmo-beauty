'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { syncOrderWithCdek } from '../_actions/orders';
import { orderStatusLabelRu } from '../_lib/order-status-ru';

type Props = {
  orderId: string;
  /** Null until the order has been polled at least once. */
  cdekStatus: string | null;
  hasCdekIdentifier: boolean;
};

/**
 * Pulls the current delivery state from CDEK for this one order.
 *
 * `cdekStatus === null` is the tell that the nightly cron has never reached
 * this order, so it is surfaced here rather than left to be inferred from the
 * database.
 */
export default function CdekSyncButton({
  orderId,
  cdekStatus,
  hasCdekIdentifier,
}: Props) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setMessage(null);
    setFailed(false);
    try {
      const result = await syncOrderWithCdek(orderId);
      if (!result.ok) {
        setFailed(true);
        setMessage(`Ошибка СДЭК: ${result.error}`);
        return;
      }
      setMessage(
        result.changed
          ? `Статус обновлён: ${orderStatusLabelRu[result.status]} (СДЭК: ${result.cdekStatus})`
          : `Статус СДЭК: ${result.cdekStatus ?? '—'}. Изменений нет.`,
      );
    } catch {
      setFailed(true);
      setMessage('Не удалось связаться с СДЭК. Попробуйте снова.');
    } finally {
      setSyncing(false);
    }
  }

  if (!hasCdekIdentifier) return null;

  return (
    <div className='mt-4 pt-4 border-t border-stone-100 space-y-2'>
      <div className='flex items-center gap-3'>
        <button
          type='button'
          onClick={handleSync}
          disabled={syncing}
          className='inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-800 font-medium px-4 py-2.5 rounded-xl transition-colors text-sm'
        >
          <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
          {syncing ? 'Синхронизация…' : 'Обновить из СДЭК'}
        </button>
        {cdekStatus === null && !message && (
          <span className='text-xs text-amber-700'>
            Заказ ни разу не проверялся в СДЭК
          </span>
        )}
      </div>
      {message && (
        <p className={`text-sm ${failed ? 'text-red-600' : 'text-stone-600'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
