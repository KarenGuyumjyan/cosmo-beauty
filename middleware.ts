import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

// NextAuth v5 session cookie name
const SESSION_COOKIE =
  process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token';

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';
    const hasSession = req.cookies.has(SESSION_COOKIE);

    if (!hasSession && !isLoginPage) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    if (hasSession && isLoginPage) {
      return NextResponse.redirect(new URL('/admin', req.url));
    }
    return NextResponse.next();
  }

  // ── All other routes → next-intl locale routing ──────────────────────────
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
