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
  | {
      ok: false;
      error: string;
      /** CDEK has no order under this uuid - see `isEntityNotFound`. */
      notFound?: boolean;
    };

/**
 * True when CDEK says the uuid corresponds to no order.
 *
 * CDEK registers orders asynchronously: `POST /orders` hands back a uuid with
 * `requests[0].state = "ACCEPTED"` before the order exists. If that processing
 * never completes - the usual case for an order cancelled shortly after
 * checkout - the uuid is stored here but resolves to nothing upstream, and
 * `GET /orders/{uuid}` answers 400 `v2_entity_not_found` forever. That is a
 * permanent, expected state, not a transient failure worth retrying.
 */
function isEntityNotFound(message: string): boolean {
  return message.includes('v2_entity_not_found');
}

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
    if (isEntityNotFound(message)) {
      console.warn(
        `[cdek:sync] Order ${order.id}: CDEK has no entity for uuid ${order.cdekUuid}`,
      );
      return {
        ok: false,
        notFound: true,
        error: 'CDEK has no order registered under this uuid',
      };
    }
    console.error(`[cdek:sync] Failed for order ${order.id}:`, message);
    return { ok: false, error: message };
  }
}
