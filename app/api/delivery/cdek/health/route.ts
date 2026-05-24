import { NextResponse } from 'next/server';

/**
 * Diagnostic endpoint to verify CDEK env wiring in any environment (including Vercel).
 * Hit it from the browser or `curl https://<your-domain>/api/delivery/cdek/health`.
 *
 * Never returns secret values - only booleans + a host hint.
 */
export async function GET() {
  const baseUrl = process.env.CDEK_BASE_URL;
  let host: string | null = null;
  let isProdHost = false;
  let isSandboxHost = false;
  if (baseUrl) {
    try {
      host = new URL(baseUrl).host;
      isProdHost = /(^|\.)api\.cdek\.ru$/.test(host) && !/edu\.cdek\.ru/.test(host);
      isSandboxHost = /api\.edu\.cdek\.ru/.test(host);
    } catch {
      host = '<invalid CDEK_BASE_URL>';
    }
  }

  return NextResponse.json({
    ok:
      Boolean(process.env.CDEK_BASE_URL) &&
      Boolean(process.env.CDEK_CLIENT_ID) &&
      Boolean(process.env.CDEK_CLIENT_SECRET),
    env: {
      CDEK_BASE_URL: Boolean(process.env.CDEK_BASE_URL),
      CDEK_CLIENT_ID: Boolean(process.env.CDEK_CLIENT_ID),
      CDEK_CLIENT_SECRET: Boolean(process.env.CDEK_CLIENT_SECRET),
      CDEK_SENDER_CITY_CODE: Boolean(process.env.CDEK_SENDER_CITY_CODE),
      NEXT_PUBLIC_YANDEX_MAPS_API_KEY: Boolean(
        process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY,
      ),
    },
    host,
    isProdHost,
    isSandboxHost,
    nodeEnv: process.env.NODE_ENV,
  });
}
