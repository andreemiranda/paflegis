# Guia de Configuração — Envio de E-mail (SMTP Gmail) & Contato

Este guia explica como configurar as variáveis de ambiente necessárias para o formulário de contato do Paflegis funcionar via SMTP do Gmail e como o protocolo atômico persistente opera.

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

> **Nota:** Caso o SMTP não esteja configurado, o endpoint `/api/v1/contato` continua funcionando normalmente: registra a mensagem com segurança no log estruturado e entrega o número de protocolo ao cidadão.

---

## 3. Protocolo Persistente e Atômico

O Paflegis gera números de protocolo estruturados no padrão **`ANO-SEQUENCIAL`** (por exemplo, `2026-000001`, `2026-000123`).

- **Incremento Atômico:** O contador é incrementado de forma atômica no armazenamento persistente (`STORAGE_DRIVER=sqlite` ou `file`), nunca em variáveis voláteis de memória ou `/tmp`.
- **Sobrevive a Cold Starts:** Em ambientes serverless (Vercel) ou containers (Cloud Run), reinicializações ou múltiplas instâncias não repetem nem resetam os protocolos.

---

## 4. Chaves de API e Proteção do Endpoint

- O nome oficial da variável de chaves de API é **`API_KEYS_PERMITIDAS`** (com suporte legado a `API_KEYS`).
- O formulário de contato web utiliza a sessão segura do frontend (`paflegis_session` assinada via HMAC) e honeypot anti-spam (`_hp`).
- Requisições externas à API respeitam rate limiting persistente e só aceitam chaves via cabeçalho HTTP (`x-api-key` ou `Authorization: Bearer`), nunca na URL.

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

Resposta esperada:
```json
{
  "sucesso": true,
  "protocolo": "2026-000001",
  "mensagem": "Mensagem recebida e registrada com sucesso."
}
```
