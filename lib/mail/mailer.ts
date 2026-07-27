/**
 * lib/mail/mailer.ts - Módulo compartilhado de envio de e-mail via SMTP do Gmail.
 *
 * Usado por: server.ts (Render/Node), api/index.ts (Vercel), netlify/functions/api.ts (Netlify).
 * NÃO compatível com Cloudflare Workers (V8 isolate não suporta conexões TCP/SMTP).
 *
 * Credenciais lidas EXCLUSIVAMENTE de variáveis de ambiente:
 *   EMAIL_USER          - endereço Gmail de envio (ex: seuprojeto@gmail.com)
 *   EMAIL_APP_PASSWORD  - senha de app de 16 dígitos gerada no Google
 *   EMAIL_DESTINO       - e-mail que receberá as mensagens de contato
 */

import nodemailer from 'nodemailer';

export interface EnvioParams {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  origem: string;
}

/** Valida presença das variáveis de e-mail na inicialização. Lança erro se ausentes. */
export function validarConfigEmail(): void {
  const missing: string[] = [];
  if (!process.env.EMAIL_USER)         missing.push('EMAIL_USER');
  if (!process.env.EMAIL_APP_PASSWORD) missing.push('EMAIL_APP_PASSWORD');
  if (!process.env.EMAIL_DESTINO)      missing.push('EMAIL_DESTINO');
  if (missing.length > 0) {
    throw new Error(
      `[mailer] Variáveis de ambiente ausentes: ${missing.join(', ')}. ` +
      'Configure-as no ambiente antes de iniciar o servidor. ' +
      'Consulte CONTATO_SETUP.md para instruções.'
    );
  }
}

/** Cria o transporter SMTP. Lança erro explícito se credenciais ausentes. */
function criarTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) {
    throw new Error('[mailer] EMAIL_USER ou EMAIL_APP_PASSWORD não configurados.');
  }
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

/** Monta o HTML do e-mail. */
function montarHtml(p: EnvioParams): string {
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; }
  .header { background: #1e293b; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 18px; }
  .header p  { margin: 4px 0 0; font-size: 12px; color: #94a3b8; }
  .body { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
  .field { margin-bottom: 16px; }
  .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: .05em; margin-bottom: 4px; }
  .value { background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; font-size: 14px; }
  .mensagem .value { white-space: pre-wrap; min-height: 60px; }
  .badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
  .footer { margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
</style></head>
<body>
  <div class="header">
    <h1>📬 Nova mensagem - Paflegis</h1>
    <p>Recebida via formulário de contato</p>
  </div>
  <div class="body">
    <div class="field">
      <div class="label">Origem</div>
      <div class="value"><span class="badge">${esc(p.origem)}</span></div>
    </div>
    <div class="field">
      <div class="label">Nome do Remetente</div>
      <div class="value">${esc(p.nome)}</div>
    </div>
    <div class="field">
      <div class="label">E-mail do Remetente</div>
      <div class="value"><a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>
    </div>
    <div class="field">
      <div class="label">Assunto</div>
      <div class="value">${esc(p.assunto)}</div>
    </div>
    <div class="field mensagem">
      <div class="label">Mensagem</div>
      <div class="value">${esc(p.mensagem)}</div>
    </div>
    <div class="footer">
      Enviado automaticamente pelo Paflegis · ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
    </div>
  </div>
</body>
</html>`.trim();
}

/**
 * Envia um e-mail de contato.
 * Lança Error se as variáveis de ambiente não estiverem configuradas ou se o SMTP falhar.
 * Nunca simula sucesso em caso de falha real.
 */
export async function enviarEmail(params: EnvioParams): Promise<void> {
  const destino = process.env.EMAIL_DESTINO;
  if (!destino) throw new Error('[mailer] EMAIL_DESTINO não configurado.');

  const transporter = criarTransporter();
  await transporter.sendMail({
    from: `"Paflegis Contato" <${process.env.EMAIL_USER}>`,
    replyTo: `"${params.nome}" <${params.email}>`,
    to: destino,
    subject: `[Paflegis · ${params.origem}] ${params.assunto}`,
    html: montarHtml(params),
  });
}
