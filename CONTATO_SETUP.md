# Guia de Configuração — Envio de E-mail (SMTP Gmail)

Este guia explica como configurar as variáveis de ambiente necessárias para
o formulário de contato do Paflegis funcionar via SMTP do Gmail.

---

## 1. Gerar a Senha de App no Google

> **Pré-requisito:** A conta Gmail deve ter **Verificação em Duas Etapas** ativada.

1. Acesse [myaccount.google.com](https://myaccount.google.com).
2. Clique em **Segurança** → **Verificação em Duas Etapas** → role até **Senhas de App**.
3. Em "Selecionar app", escolha **Outro (nome personalizado)** → escreva `Paflegis`.
4. Clique em **Gerar**.
5. Anote os **16 dígitos** exibidos (ex.: `abcd efgh ijkl mnop`). Você só verá uma vez.
6. Remova os espaços ao salvar: `abcdefghijklmnop`.

---

## 2. Variáveis de Ambiente Necessárias

| Variável           | Descrição                                      | Exemplo                        |
|--------------------|------------------------------------------------|--------------------------------|
| `EMAIL_USER`       | Endereço Gmail que envia os e-mails            | `paflegis@gmail.com`           |
| `EMAIL_APP_PASSWORD` | Senha de app de 16 dígitos (sem espaços)     | `abcdefghijklmnop`             |
| `EMAIL_DESTINO`    | E-mail que recebe as mensagens de contato      | `seuemail@exemplo.com`         |

---

## 3. Ambiente de Desenvolvimento Local (Replit)

No Replit, **nunca use `.env` para credenciais**. Use os **Replit Secrets**:

1. Abra o painel lateral → **Secrets** (ícone de cadeado).
2. Adicione cada variável:
   - `EMAIL_USER` → seu Gmail de envio
   - `EMAIL_APP_PASSWORD` → a senha de 16 dígitos
   - `EMAIL_DESTINO` → e-mail de destino das mensagens
3. As variáveis ficam disponíveis como `process.env.EMAIL_USER` etc.

**Nunca escreva a senha de app em nenhum arquivo do repositório**,
nem mesmo comentada ou como exemplo.

---

## 4. Deploy em Produção

### Render (server.ts)
1. Acesse o painel do serviço → **Environment** → **Environment Variables**.
2. Adicione as 3 variáveis acima.
3. Faça um novo deploy.

### Vercel (api/index.ts)
1. Acesse o projeto → **Settings** → **Environment Variables**.
2. Adicione as 3 variáveis com escopo **Production** (e **Preview** se quiser testar).
3. Redeploy.

### Netlify (netlify/functions/api.ts)
1. Acesse **Site settings** → **Build & Deploy** → **Environment** → **Environment variables**.
2. Adicione as 3 variáveis.
3. Redeploy via painel ou `git push`.

### Cloudflare Pages (functions/api/[[path]].ts)
> ⚠️ **Atenção:** O envio de e-mail via SMTP **não é suportado** em Cloudflare Workers
> (V8 isolate não permite conexões TCP). O endpoint `/api/v1/contato` retornará HTTP 503
> nessa plataforma. Para usar o formulário de contato, faça deploy em Render, Vercel ou Netlify.

---

## 5. Testar Localmente

Com os Secrets configurados no Replit, o servidor detectará as variáveis automaticamente.

Para testar via `curl`:

```bash
curl -s -X POST http://localhost:5000/api/v1/contato \
  -H "Content-Type: application/json" \
  -d '{
    "nome":     "Teste",
    "email":    "teste@exemplo.com",
    "assunto":  "Teste de envio",
    "mensagem": "Mensagem de teste do formulário.",
    "origem":   "Contato Geral",
    "_hp":      ""
  }'
```

Resposta esperada em caso de sucesso: `{"sucesso":true}`

---

## 6. Segurança

- `.env` e `.env*` já estão no `.gitignore` — nunca serão versionados.
- A senha de app **só deve existir** nos painéis de secrets das plataformas,
  nunca em arquivo de texto dentro do repositório.
- O formulário inclui proteção **honeypot** (`_hp`): submissões de bots são
  rejeitadas silenciosamente sem revelar o motivo.
