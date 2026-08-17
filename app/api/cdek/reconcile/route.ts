import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncCdekStatus } from '@/lib/orders/sync-cdek-status';

// Fetches every in-flight CDEK order from CDEK and syncs its delivery status.
//
// Scheduled by the host's crontab via scripts/cdek-reconcile.sh — NOT by
// vercel.json, which only ever ran on Vercel and stopped silently when the app
// moved to its own hosting. Install instructions are in that script's header.

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
    const result = await syncCdekStatus(order);
    if (result.ok) {
      if (result.changed) updated += 1;
    } else {
      errors.push({ orderId: order.id, error: result.error });
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
