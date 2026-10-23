import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken, verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { getConfig, resolveRequestOrigin } from '@/lib/config';
import { validateApiRequest } from '@/lib/auth/apiKeyAuth';

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const config = getConfig();

  const isApiRoute = req.nextUrl.pathname === '/api' || req.nextUrl.pathname.startsWith('/api/');

  // 1. Injeta cookie de sessão seguro e assinado apenas para navegação do usuário no navegador (páginas do app)
  if (!isApiRoute) {
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
  }

  // 2. Proteção Integral da API via API Key definida nas variáveis de ambiente
  if (isApiRoute) {
    const origin = req.headers.get('origin');
    const appOrigin = resolveRequestOrigin(req.headers);

    // Permite requisições preflight CORS (OPTIONS)
    if (req.method === 'OPTIONS') {
      const corsRes = new NextResponse(null, { status: 204 });
      if (origin && (config.corsAllowedOrigins.includes(origin) || origin === appOrigin)) {
        corsRes.headers.set('Access-Control-Allow-Origin', origin);
        corsRes.headers.set('Access-Control-Allow-Credentials', 'true');
        corsRes.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
        corsRes.headers.set(
          'Access-Control-Allow-Headers',
          'Content-Type, Authorization, x-api-key, X-API-KEY, x-api-keys, X-API-KEYS, x-cron-secret'
        );
      }
      return corsRes;
    }

    // Exceção pontual: POST /api/v1/contato (formulário de ouvidoria/contato do cidadão protegido por rate-limit e honeypot)
    const isContactPost = req.method === 'POST' && req.nextUrl.pathname === '/api/v1/contato';

    if (!isContactPost) {
      // Valida obrigatoriedade da API Key (aceita via ?API_KEYS=<chave>, x-api-key ou Authorization: Bearer)
      const auth = validateApiRequest(req);
      if (!auth.authorized) {
        const errorHeaders = new Headers({
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, max-age=0',
        });
        if (origin && (config.corsAllowedOrigins.includes(origin) || origin === appOrigin)) {
          errorHeaders.set('Access-Control-Allow-Origin', origin);
          errorHeaders.set('Access-Control-Allow-Credentials', 'true');
        }

        return NextResponse.json(
          {
            status: 'erro',
            codigo: auth.statusCode || 401,
            erro:
              auth.reason ||
              'Acesso não autorizado. Toda a API é estritamente protegida por API Key configurada nas variáveis de ambiente.',
            mensagem:
              'Para acessar qualquer endpoint da API, forneça sua chave via query string (?API_KEYS=<sua_chave>) ou pelo cabeçalho x-api-key / Authorization: Bearer.',
            dica: 'Exemplo: /api/v1/?API_KEYS=sk_1724ebeae5b8b48215cf762ca8bb2a0c',
            documentacao: '/api-docs',
          },
          { status: auth.statusCode || 401, headers: errorHeaders }
        );
      }
    }

    if (origin && (config.corsAllowedOrigins.includes(origin) || origin === appOrigin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
      res.headers.set('Access-Control-Allow-Credentials', 'true');
      res.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
      res.headers.set(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, x-api-key, X-API-KEY, x-api-keys, X-API-KEYS, x-cron-secret'
      );
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
