import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCdekOrderStatus } from '@/lib/cdek/service';
import { mapCdekStatusToOrderStatus } from '@/lib/cdek/status-map';

// Cron: runs daily at 22:00 Moscow time (19:00 UTC) — see vercel.json.
// Fetches every in-flight CDEK order from CDEK and syncs its delivery status.

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Orders in these statuses are terminal for CDEK purposes and need no polling.
const TERMINAL = ['DELIVERED', 'CANCELLED'] as const;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  // If no secret is configured, allow (Vercel Cron calls are trusted); if one
  // is set, require it so the endpoint can't be triggered by outsiders.
  if (!secret) return true;
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function reconcile() {
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ cdekUuid: { not: null } }, { cdekTrackingNumber: { not: null } }],
      status: { notIn: [...TERMINAL] },
    },
    select: {
      id: true,
      cdekUuid: true,
      cdekTrackingNumber: true,
      status: true,
    },
  });

  let checked = 0;
  let updated = 0;
  const errors: Array<{ orderId: string; error: string }> = [];

  for (const order of orders) {
    checked += 1;
    try {
      const cdek = await getCdekOrderStatus({
        uuid: order.cdekUuid,
        cdekNumber: order.cdekTrackingNumber,
      });

      const mapped = mapCdekStatusToOrderStatus(cdek.code);
      const statusChanged = mapped !== null && mapped !== order.status;

      await prisma.order.update({
        where: { id: order.id },
        data: {
          cdekStatus: cdek.code,
          cdekRawResponse: cdek.rawResponse as object,
          // Backfill the tracking number if CDEK now knows it.
          ...(cdek.trackingNumber && !order.cdekTrackingNumber
            ? { cdekTrackingNumber: cdek.trackingNumber }
            : {}),
          ...(statusChanged ? { status: mapped } : {}),
        },
      });

      if (statusChanged) updated += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[cdek:reconcile] Failed for order ${order.id}:`, message);
      errors.push({ orderId: order.id, error: message });
    }
  }

  console.log(
    `[cdek:reconcile] checked=${checked} updated=${updated} errors=${errors.length}`,
  );

  return { checked, updated, errors };
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await reconcile();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error('[cdek:reconcile] Fatal error', error);
    return NextResponse.json({ error: 'Reconcile failed' }, { status: 500 });
  }
}
