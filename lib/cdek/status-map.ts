import type { OrderStatus } from '@prisma/client'

// CDEK status codes that mean the parcel has been handed over/is in transit
// but not yet delivered. Anything past "accepted" counts as shipped.
const NOT_YET_SHIPPED = new Set(['CREATED', 'ACCEPTED'])
const CANCELLED_CODES = new Set(['INVALID'])

/**
 * Translate a CDEK status code into our internal OrderStatus.
 *
 * Returns `null` when the CDEK status does not warrant a change (e.g. the
 * order is only just created), so the caller can leave the current status
 * untouched.
 */
export function mapCdekStatusToOrderStatus(
  code: string | null | undefined,
): OrderStatus | null {
  if (!code) return null
  const upper = code.toUpperCase()

  if (upper === 'DELIVERED') return 'DELIVERED'
  if (CANCELLED_CODES.has(upper)) return 'CANCELLED'
  if (NOT_YET_SHIPPED.has(upper)) return null

  // Any other CDEK status means the parcel is somewhere in the delivery chain.
  return 'SHIPPED'
}
