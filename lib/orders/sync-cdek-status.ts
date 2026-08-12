import type { OrderStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getCdekOrderStatus } from '@/lib/cdek/service';
import { mapCdekStatusToOrderStatus } from '@/lib/cdek/status-map';

export type CdekSyncResult =
  | {
      ok: true;
      /** True when the order's own status moved, not just its CDEK mirror. */
      changed: boolean;
      cdekStatus: string | null;
      status: OrderStatus;
    }
  | { ok: false; error: string };

export type SyncableOrder = {
  id: string;
  cdekUuid: string | null;
  cdekTrackingNumber: string | null;
  status: OrderStatus;
};

/**
 * Pull one order's current state from CDEK and write it back.
 *
 * Lives here rather than inside the reconcile route so the nightly cron and
 * the admin's "sync now" button run exactly the same code. They used to be the
 * same thing, which meant an order the cron had never reached - because the
 * cron itself was not running - could not be corrected from anywhere at all.
 *
 * `cdekStatus` and `status` are written in one update: an order whose
 * `cdekStatus` is null has never been polled, and that stays a reliable signal.
 */
export async function syncCdekStatus(
  order: SyncableOrder,
): Promise<CdekSyncResult> {
  if (!order.cdekUuid && !order.cdekTrackingNumber) {
    return { ok: false, error: 'Order has no CDEK identifier' };
  }

  try {
    const cdek = await getCdekOrderStatus({
      uuid: order.cdekUuid,
      cdekNumber: order.cdekTrackingNumber,
    });

    const mapped = mapCdekStatusToOrderStatus(cdek.code);
    const changed = mapped !== null && mapped !== order.status;

    await prisma.order.update({
      where: { id: order.id },
      data: {
        cdekStatus: cdek.code,
        cdekRawResponse: cdek.rawResponse as object,
        // Backfill the tracking number if CDEK now knows it.
        ...(cdek.trackingNumber && !order.cdekTrackingNumber
          ? { cdekTrackingNumber: cdek.trackingNumber }
          : {}),
        ...(changed ? { status: mapped } : {}),
      },
    });

    return {
      ok: true,
      changed,
      cdekStatus: cdek.code,
      status: changed ? mapped : order.status,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[cdek:sync] Failed for order ${order.id}:`, message);
    return { ok: false, error: message };
  }
}
