type TokenCache = {
  value: string;
  expiresAtMs: number;
};

let cachedToken: TokenCache | null = null;

function getBaseUrl(): string {
  const url = process.env.CDEK_BASE_URL;
  if (!url) throw new Error('CDEK_BASE_URL is not configured');
  return url.replace(/\/+$/, '');
}

async function fetchToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAtMs > now + 15_000) {
    return cachedToken.value;
  }

  const clientId = process.env.CDEK_CLIENT_ID?.trim();
  const clientSecret = process.env.CDEK_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    const missing = [
      !clientId && 'CDEK_CLIENT_ID',
      !clientSecret && 'CDEK_CLIENT_SECRET',
    ].filter(Boolean);
    throw new Error(
      `CDEK OAuth credentials missing (${missing.join(', ')}). Set them in .env — same values as in the CDEK integration account (Интеграция). Also set CDEK_BASE_URL (e.g. https://api.edu.cdek.ru for the test API).`,
    );
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${getBaseUrl()}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDEK auth failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in?: number };
  const ttlMs = Math.max((json.expires_in ?? 3600) * 1000, 30_000);
  cachedToken = {
    value: json.access_token,
    expiresAtMs: now + ttlMs,
  };
  return json.access_token;
}

export async function cdekRequest<T>(
  path: string,
  init: Omit<RequestInit, 'headers'> & { headers?: HeadersInit } = {}
): Promise<T> {
  const token = await fetchToken();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`CDEK request failed (${path}): ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}
