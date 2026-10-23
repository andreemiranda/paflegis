/**
 * lib/auth/session.ts — Emissão e validação de sessão segura assinada com HMAC.
 * Permite que o frontend do Paflegis realize requisições dinâmicas de busca/filtro
 * no cliente sem necessidade de chaves de API públicas e sem confiar em cabeçalhos forjáveis.
 *
 * Utiliza utilitários criptográficos puros (lib/crypto/pure.ts) para compatibilidade nativa
 * com o Edge Runtime do Next.js (middleware) e com Node.js (Route Handlers).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getConfig } from '@/lib/config';
import {
  hmacSha256Bytes,
  bytesToBase64Url,
  utf8ToBase64Url,
  base64UrlToUtf8,
  timingSafeEqualStr,
  randomHex,
} from '@/lib/crypto/pure';

export const SESSION_COOKIE_NAME = 'paflegis_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 horas

interface SessionPayload {
  issuedAt: number;
  nonce: string;
}

/**
 * Cria um token de sessão assinado com HMAC-SHA256 em formato compactado e seguro.
 */
export function createSessionToken(): string {
  const config = getConfig();
  const payload: SessionPayload = {
    issuedAt: Date.now(),
    nonce: randomHex(8),
  };
  const data = utf8ToBase64Url(JSON.stringify(payload));
  const signatureBytes = hmacSha256Bytes(config.sessionSecret, data);
  const signature = bytesToBase64Url(signatureBytes);
  return `${data}.${signature}`;
}

/**
 * Valida a integridade e expiração de um token de sessão HMAC em tempo constante.
 */
export function verifySessionToken(token?: string | null): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [data, signature] = parts;
  const config = getConfig();

  const expectedSignatureBytes = hmacSha256Bytes(config.sessionSecret, data);
  const expectedSignature = bytesToBase64Url(expectedSignatureBytes);

  try {
    if (!timingSafeEqualStr(signature, expectedSignature)) {
      return false;
    }

    const payload: SessionPayload = JSON.parse(base64UrlToUtf8(data));
    const ageSeconds = (Date.now() - payload.issuedAt) / 1000;
    if (ageSeconds > SESSION_MAX_AGE_SECONDS) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Injeta o cookie de sessão assinado na resposta caso não exista ou esteja expirado.
 */
export function ensureSessionCookie(req: NextRequest, res: NextResponse): void {
  const existingCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!existingCookie || !verifySessionToken(existingCookie)) {
    const newToken = createSessionToken();
    res.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: newToken,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });
  }
}

/**
 * Verifica se a requisição contém uma sessão de navegador válida emitida pelo próprio app.
 */
export function hasValidSession(req: NextRequest): boolean {
  const cookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(cookie);
}
