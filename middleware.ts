import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getConfig, resolveRequestOrigin } from '@/lib/config';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const config = getConfig();

  // 1. Injeta cookie de sessão seguro e assinado se for requisição de página/navegação do usuário
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie || !verifySessionToken(sessionCookie)) {
    const token = createSessionToken();
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 4, // 4 horas
      path: '/',
    });
  }

  // 2. Para requisições em /api/*, rejeita chaves na query string e trata CORS
  if (req.nextUrl.pathname.startsWith('/api')) {
    const hasQueryKey =
      req.nextUrl.searchParams.has('x-api-key') ||
      req.nextUrl.searchParams.has('api_key') ||
      req.nextUrl.searchParams.has('x_api_key');

    if (hasQueryKey) {
      return NextResponse.json(
        {
          erro: 'Por razões de segurança, chaves de API não são aceitas via URL (query string). Envie pelo cabeçalho x-api-key ou Authorization: Bearer.',
        },
        { status: 400 }
      );
    }

    const origin = req.headers.get('origin');
    const appOrigin = resolveRequestOrigin(req.headers);

    if (origin && (config.corsAllowedOrigins.includes(origin) || origin === appOrigin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, X-API-KEY, x-cron-secret');
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|images/|assets/).*)',
  ],
};
