import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimiter';
import { slog } from '@/lib/sapl/backend';
import { enviarEmail, enviarAutoResposta } from '@/lib/mail/mailer';
import { getNextProtocolNumber } from '@/lib/sapl/cache';

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, 10, 60 * 1000); // 10 envios por minuto
  if (!rl.allowed) {
    return NextResponse.json(
      { sucesso: false, erro: 'Muitas tentativas de envio. Aguarde um minuto.' },
      { status: 429 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ sucesso: false, erro: 'Dados inválidos.' }, { status: 400 });
  }

  const { nome, email, assunto, mensagem, origem, _hp } = body || {};

  // Honeypot anti-spam
  if (_hp) {
    return NextResponse.json({ sucesso: true });
  }

  if (!nome?.trim() || !email?.trim() || !assunto?.trim() || !mensagem?.trim()) {
    return NextResponse.json(
      { sucesso: false, erro: 'Todos os campos são obrigatórios.' },
      { status: 400 }
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json(
      { sucesso: false, erro: 'Formato de e-mail inválido.' },
      { status: 400 }
    );
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_APP_PASSWORD && process.env.EMAIL_DESTINO) {
    try {
      const protocoloNum = getNextProtocolNumber();
      const protocolo = String(protocoloNum).padStart(3, '0');

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

      return NextResponse.json({ sucesso: true, protocolo });
    } catch (err: any) {
      slog('ERROR', 'handleContato', 'Erro ao enviar e-mail via SMTP', err);
      return NextResponse.json({
        sucesso: false,
        erro: `Falha na conexão SMTP (${err?.message || 'Erro de envio'}). Verifique as credenciais no Vercel.`,
      });
    }
  }

  slog('INFO', 'handleContato', 'Mensagem de contato recebida (sem SMTP configurado)', {
    nome,
    email,
    assunto,
  });

  return NextResponse.json({
    sucesso: true,
    mensagem: 'Mensagem recebida e registrada com sucesso.',
  });
}
