import { NextResponse } from 'next/server';

const CDEK_REQUEST_RX = /^CDEK request failed \(([^)]+)\): (\d+)\s+([\s\S]*)$/;
const CDEK_AUTH_RX = /^CDEK auth failed: (\d+)\s+([\s\S]*)$/;

/**
 * Machine-readable classification so the client can show a localized message
 * instead of parsing prose or dumping raw CDEK JSON at the customer.
 *
 *  - `unserviceable` CDEK simply does not deliver there with this tariff. This
 *    is a normal outcome the customer must see as a friendly message.
 *  - `auth`          credentials/contract problem - our fault, not the user's.
 *  - `unknown`       anything else (outage, malformed request…).
 */
export type CdekErrorReason = 'unserviceable' | 'auth' | 'unknown';

export type CdekErrorPayload = {
  error: string;
  source: 'cdek';
  reason: CdekErrorReason;
  upstreamStatus?: number;
  upstreamPath?: string;
  hint?: string;
  details: string;
};

/**
 * CDEK error codes that mean "no service for this direction/tariff".
 * Confirmed against api.cdek.ru/v2 with an unknown city and an unserved route.
 */
const UNSERVICEABLE_CODES = [
  'v2_recipient_location_not_recognized',
  'v2_sender_location_not_recognized',
  'err_result_service_empty',
  'v2_tariff_code_invalid',
];

function classify(upstreamStatus: number | undefined, body: string): CdekErrorReason {
  if (upstreamStatus === 401 || upstreamStatus === 403 || upstreamStatus === 410) {
    return 'auth';
  }
  if (UNSERVICEABLE_CODES.some((code) => body.includes(code))) {
    return 'unserviceable';
  }
  // CDEK answers an unserved direction with 400 + a Russian explanation that
  // does not always carry one of the codes above.
  if (upstreamStatus === 400) return 'unserviceable';
  return 'unknown';
}

function pickHint(status: number, baseUrl: string | undefined): string {
  const isProd = baseUrl && /api\.cdek\.ru/.test(baseUrl) && !/edu\.cdek\.ru/.test(baseUrl);
  if (status === 401) {
    return isProd
      ? 'CDEK production rejected these credentials. Verify CDEK_CLIENT_ID / CDEK_CLIENT_SECRET in the deployment environment match the integration key from CDEK personal cabinet (Интеграция → Создать ключ).'
      : 'CDEK sandbox does not recognise these credentials. The well-known public test keys were rotated by CDEK; request real test credentials from CDEK support.';
  }
  if (status === 403) {
    return 'OAuth token authenticated, but the contract is not authorised for this endpoint. Contact your CDEK manager to enable API access on the contract.';
  }
  if (status === 410) {
    return isProd
      ? 'CDEK production proxy returned 410 Gone. This means the OAuth token is valid but the contract has no API access enabled. Open lk.cdek.ru → Интеграция and contact CDEK to enable production integration. Until then switch CDEK_BASE_URL to https://api.edu.cdek.ru/v2 and use sandbox credentials.'
      : 'Sandbox endpoint returned 410. Verify CDEK_BASE_URL and that the path exists in the v2 sandbox.';
  }
  return '';
}

export function cdekErrorResponse(error: unknown, label: string): NextResponse<CdekErrorPayload> {
  const message = error instanceof Error ? error.message : String(error);
  const baseUrl = process.env.CDEK_BASE_URL;

  const reqMatch = message.match(CDEK_REQUEST_RX);
  if (reqMatch) {
    const [, path, statusStr, body] = reqMatch;
    const upstreamStatus = Number(statusStr);
    const reason = classify(upstreamStatus, body);
    return NextResponse.json(
      {
        error: label,
        source: 'cdek',
        reason,
        upstreamStatus,
        upstreamPath: path,
        hint: pickHint(upstreamStatus, baseUrl),
        details: body.slice(0, 600),
      },
      // An unserved destination is a valid answer about the request, not an
      // upstream failure - 422 lets the client treat it as a normal outcome
      // while 502 still means "CDEK is broken".
      { status: reason === 'unserviceable' ? 422 : 502 },
    );
  }

  const authMatch = message.match(CDEK_AUTH_RX);
  if (authMatch) {
    const [, statusStr, body] = authMatch;
    const upstreamStatus = Number(statusStr);
    return NextResponse.json(
      {
        error: label,
        source: 'cdek',
        reason: 'auth',
        upstreamStatus,
        upstreamPath: 'oauth/token',
        hint: pickHint(upstreamStatus, baseUrl),
        details: body.slice(0, 600),
      },
      { status: 502 },
    );
  }

  return NextResponse.json(
    {
      error: label,
      source: 'cdek',
      reason: 'unknown',
      details: message.slice(0, 600),
    },
    { status: 500 },
  );
}
