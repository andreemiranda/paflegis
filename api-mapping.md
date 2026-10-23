# Mapeamento de Endpoints da API SAPL para o Paflegis

Base Domain Upstream Padrão: `https://sapl.pedroafonso.to.leg.br`  
API Base Upstream: `https://sapl.pedroafonso.to.leg.br/api`  
Swagger UI Upstream: `https://sapl.pedroafonso.to.leg.br/api/schema/swagger-ui/`

---

## 1. Arquitetura da API Nativa Espelhada (`/api/*`)

Diferente de um proxy simples, o Paflegis atua como **dono de uma API própria espelhada** sobre Next.js App Router:

- **Roteamento Dinâmico Catch-All (`app/api/[...path]/route.ts`):**  
  Atende dinamicamente a todos os recursos da raiz da API do SAPL upstream descobertos via OpenAPI/Schema.
- **Equivalência Estrita:**  
  `GET /api/materia/materialegislativa/` espelha `{SAPL_API_BASE}/materia/materialegislativa/`.  
  `GET /api/sessao/sessaoplenaria/420/` espelha `{SAPL_API_BASE}/sessao/sessaoplenaria/420/`.
- **Somente Leitura (Read-Only):**  
  Aceita apenas `GET`, `HEAD` e `OPTIONS`. Qualquer método de escrita (`POST`, `PUT`, `PATCH`, `DELETE`) em `/api` retorna `405 Method Not Allowed`.
- **Reescrita Total de Links:**  
  Todas as URLs presentes nos JSONs (campos `url`, `next`, `previous`, `texto_original`, `anexos`) são convertidas para o domínio onde o aplicativo estiver publicado.
- **Proteção e Sanitização LGPD:**  
  Substitui automaticamente qualquer IPv4 ou IP de origem pelo domínio configurado e mascara campos de dados estritamente pessoais (`cpf`, `telefone_celular`, `email_pessoal`, etc.).

---

## 2. Streaming e Espelho de Mídia (`/api/media/*`)

Entregue pelo Route Handler `app/api/media/[...path]/route.ts`:
- Entrega PDFs, atas, pautas, anexos e gravações com headers HTTP corretos (`Content-Type`, `Content-Disposition`, `Range`, `Accept-Ranges`, `ETag`).
- Com `MIRROR_MEDIA=true`, armazena cópias locais duráveis para manter o acesso mesmo se o servidor de origem estiver indisponível.
- Proteção anti-SSRF e path traversal (`..` e caminhos arbitrários são bloqueados).

---

## 3. Endpoints Agregados e Otimizados (`/api/v1/*`)

Mantidos para compatibilidade retroativa e consumo rápido:

| Método | Caminho | Descrição |
|---|---|---|
| `GET` | `/api/v1/materias` | Listagem agregada de matérias com busca, filtros de tipo, ano e paginação |
| `GET` | `/api/v1/materias/:id` | Detalhe completo com tramitações, autoria e documentos acessórios |
| `GET` | `/api/v1/normas` | Legislação municipal (leis, decretos, resoluções) |
| `GET` | `/api/v1/normas/:id` | Detalhe da norma com texto integral e anexos |
| `GET` | `/api/v1/sessoes` | Sessões plenárias com pautas, atas e vídeos |
| `GET` | `/api/v1/sessoes/:id` | Detalhes da sessão com ordem do dia e presenças |
| `GET` | `/api/v1/estatisticas` | Contagens consolidadas reais (sem números inventados) |
| `GET` | `/api/v1/endpoints` | Catálogo dinâmico dos endpoints descobertos |
| `GET` | `/api/v1/health` | Diagnóstico seguro de integridade e latência |
| `POST` | `/api/v1/contato` | Submissão de contato com protocolo atômico persistente |
| `POST` | `/api/v1/sync` | Disparo de sincronização (protegido por `CRON_SECRET`) |
| `GET` | `/api/v1/sync/status` | Status público de sincronização e integridade do espelho |
| `POST` | `/api/v1/ai/resumo` | Resumo de matérias em linguagem simples com Google Gemini (opcional) |
| `GET` | `/api/v1/openapi.json` | Especificação OpenAPI 3.0 dinâmica |

---

## 4. Autenticação e Rate Limiting

- **Nome oficial:** `API_KEYS_PERMITIDAS` (com alias legado `API_KEYS`).
- **Modos:** `API_ACCESS_MODE=open` (leitura pública com rate limit por IP) ou `API_ACCESS_MODE=keyed` (chave obrigatória).
- **Envio Seguro:** Somente via cabeçalho HTTP (`x-api-key` ou `Authorization: Bearer <chave>`). Rejeita chaves na URL.
- **Frontend do App:** Utiliza cookie de sessão assinado com HMAC-SHA256 (`paflegis_session`), sem expor chaves públicas no navegador.
