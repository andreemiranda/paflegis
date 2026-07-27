/**
 * lib/mail/http-mailer.ts - Envio de e-mail via API HTTP (Resend).
 *
 * Compatível com: Netlify Functions, Vercel Serverless, Cloudflare Workers/Pages.
 * Usa apenas fetch — sem socket TCP, sem nodemailer, sem dependências extras.
 *
 * O chamador lê as credenciais do seu próprio contexto de env vars e passa via `cfg`:
 *   cfg.apiKey  → RESEND_API_KEY  (obrigatório)
 *   cfg.destino → EMAIL_DESTINO   (obrigatório)
 *   cfg.from    → RESEND_FROM     (obrigatório — remetente verificado no Resend)
 */

export interface EnvioParams {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
  origem: string;
}

export interface HttpMailerConfig {
  apiKey:  string;
  destino: string;
  from?:   string;
}

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
      Enviado automaticamente pelo Paflegis
    </div>
  </div>
</body>
</html>`.trim();
}

/**
 * Envia e-mail via Resend REST API usando fetch.
 * Lança Error com mensagem descritiva se a API rejeitar ou se credenciais faltarem.
 */
export async function enviarEmailHttp(
  params: EnvioParams,
  cfg: HttpMailerConfig,
): Promise<void> {
  if (!cfg.apiKey)  throw new Error('[http-mailer] RESEND_API_KEY não configurado.');
  if (!cfg.destino) throw new Error('[http-mailer] EMAIL_DESTINO não configurado.');
  if (!cfg.from)    throw new Error('[http-mailer] RESEND_FROM não configurado. Defina um remetente verificado no Resend.');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from:     cfg.from,
      to:       [cfg.destino],
      reply_to: `${params.nome} <${params.email}>`,
      subject:  `[Paflegis · ${params.origem}] ${params.assunto}`,
      html:     montarHtml(params),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`[http-mailer] Resend API ${res.status}: ${body}`);
  }
}
