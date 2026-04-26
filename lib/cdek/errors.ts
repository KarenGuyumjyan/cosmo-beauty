import { NextResponse } from 'next/server';

const CDEK_REQUEST_RX = /^CDEK request failed \(([^)]+)\): (\d+)\s+([\s\S]*)$/;
const CDEK_AUTH_RX = /^CDEK auth failed: (\d+)\s+([\s\S]*)$/;

export type CdekErrorPayload = {
  error: string;
  source: 'cdek';
  upstreamStatus?: number;
  upstreamPath?: string;
  hint?: string;
  details: string;
};

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
    return NextResponse.json(
      {
        error: label,
        source: 'cdek',
        upstreamStatus,
        upstreamPath: path,
        hint: pickHint(upstreamStatus, baseUrl),
        details: body.slice(0, 600),
      },
      { status: 502 },
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
      details: message.slice(0, 600),
    },
    { status: 500 },
  );
}
