import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimitAsync, applyRateLimitHeaders } from '@/lib/rateLimiter';
import { slog } from '@/lib/sapl/backend';
import { enviarEmail, enviarAutoResposta } from '@/lib/mail/mailer';
import { getNextPersistentProtocolNumber } from '@/lib/storage';

export async function POST(req: NextRequest) {
  const rl = await checkRateLimitAsync(req, 10, 60 * 1000); // 10 envios por minuto
  const headers = new Headers();
  applyRateLimitHeaders(headers, rl);

  if (!rl.allowed) {
    return NextResponse.json(
      { sucesso: false, erro: 'Muitas tentativas de envio. Aguarde um minuto.' },
      { status: 429, headers }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Dados inválidos.' }, { status: 400, headers });
  }

  const { nome, email, assunto, mensagem, origem, _hp } = body || {};

  // Honeypot anti-spam
  if (_hp) {
    return NextResponse.json({ sucesso: true }, { headers });
  }

  if (!nome?.trim() || !email?.trim() || !assunto?.trim() || !mensagem?.trim()) {
    return NextResponse.json(
      { sucesso: false, erro: 'Todos os campos são obrigatórios.' },
      { status: 400, headers }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { sucesso: false, erro: 'Formato de e-mail inválido.' },
      { status: 400, headers }
    );
  }

  // Gera protocolo persistente e atômico (ex: 2026-000123)
  const protocolo = await getNextPersistentProtocolNumber();

  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_DESTINO) {
    try {
      await enviarEmail({
        nome: nome.trim(),
        email: email.trim(),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
        origem: (origem || 'Contato').trim(),
      });

      try {
        await enviarAutoResposta(email.trim(), nome.trim(), protocolo);
      } catch (errAuto) {
        slog('WARN', 'handleContato', 'Erro ao enviar auto-resposta', errAuto);
      }

      return NextResponse.json({ sucesso: true, protocolo }, { headers });
    } catch (err: any) {
      slog('ERROR', 'handleContato', 'Erro ao enviar e-mail via SMTP', err);
      return NextResponse.json({
        sucesso: false,
        protocolo,
        erro: `Falha na conexão SMTP (${err?.message || 'Erro de envio'}). Verifique as credenciais no Vercel.`,
      }, { headers });
    }
  }

  slog('INFO', 'handleContato', `Mensagem registrada sob o protocolo ${protocolo} (sem SMTP configurado)`, {
    nome,
    email,
    assunto,
  });

  return NextResponse.json({
    sucesso: true,
    protocolo,
    mensagem: 'Mensagem recebida e registrada com sucesso.',
  }, { headers });
}
