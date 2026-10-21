# Guia de Configuração — Envio de E-mail (SMTP Gmail)

Este guia explica como configurar as variáveis de ambiente necessárias para o formulário de contato do Paflegis funcionar via SMTP do Gmail.

---

## 1. Gerar a Senha de App no Google

> **Pré-requisito:** A conta Gmail deve ter a **Verificação em Duas Etapas** ativada.

1. Acesse [myaccount.google.com](https://myaccount.google.com).
2. Clique em **Segurança** → **Verificação em Duas Etapas** → role até **Senhas de App**.
3. Em "Selecionar app", escolha **Outro (nome personalizado)** → escreva `Paflegis`.
4. Clique em **Gerar**.
5. Anote os **16 dígitos** exibidos (ex.: `abcd efgh ijkl mnop`). Você só verá essa senha uma vez.
6. Remova os espaços ao salvar: `abcdefghijklmnop`.

---

## 2. Variáveis de Ambiente Necessárias

| Variável | Descrição | Exemplo |
|---|---|---|
| `EMAIL_USER` | Endereço Gmail que envia os e-mails | `seu-email@gmail.com` |
| `EMAIL_APP_PASSWORD` | Senha de app de 16 dígitos (sem espaços) | `abcdefghijklmnop` |
| `EMAIL_DESTINO` | E-mail que recebe as mensagens enviadas pelos cidadãos | `contato@exemplo.com` |

---

## 3. Configuração em Produção (Vercel)

1. Acesse o painel da **Vercel** → Selecione o projeto `paflegis`.
2. Acesse **Settings** → **Environment Variables**.
3. Adicione as 3 variáveis (`EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_DESTINO`) com escopo **Production** (e **Preview**, se desejar).
4. Realize um novo deploy para ativar as variáveis.

---

## 4. Configuração em Desenvolvimento Local

1. No arquivo `.env.local` (ou `.env`), defina:
   ```env
   EMAIL_USER=seu-email@gmail.com
   EMAIL_APP_PASSWORD=abcdefghijklmnop
   EMAIL_DESTINO=destino@exemplo.com
   ```
2. Inicie o servidor com `npm run dev`.

---

## 5. Testar o Envio via cURL

```bash
curl -s -X POST http://localhost:3000/api/v1/contato \
  -H "Content-Type: application/json" \
  -d '{
    "nome":     "Cidadão Teste",
    "email":    "cidadao@exemplo.com",
    "assunto":  "Dúvida sobre projeto de lei",
    "mensagem": "Gostaria de mais detalhes sobre a tramitação da matéria.",
    "origem":   "Contato Geral",
    "_hp":      ""
  }'
```

Resposta esperada em caso de sucesso: `{"sucesso":true}`

---

## 6. Segurança e Proteção Antispam

- **Proteção Honeypot (`_hp`)**: Submissões automatizadas de bots que preenchem campos ocultos são rejeitadas de forma segura e silenciosa.
- **Armazenamento Seguro**: Nunca commite credenciais ou senhas de app no controle de versão Git. Use sempre os painéis seguros de variáveis de ambiente.
