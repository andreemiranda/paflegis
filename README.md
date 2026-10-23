# Paflegis

Plataforma cívica independente de consulta, transparência legislativa e API nativa espelhada para câmaras municipais, conectada ao SAPL (Sistema de Apoio ao Processo Legislativo).

> **Atenção:** O Paflegis é uma iniciativa cívica independente, sem vínculo institucional com o Poder Público, fundamentada na Lei de Acesso à Informação (Lei Federal nº 12.527/2011).

---

## Destaques do Projeto

- **API Nativa Espelhada (`/api/*`):** Reproduz 100% dos recursos do SAPL upstream de forma dinâmica sob rota catch-all, com paginação, filtros, busca e documentação OpenAPI 3.0 interativa (`/api-docs`).
- **Configurável para Qualquer SAPL:** Alterne entre diferentes câmaras municipais alterando apenas `SAPL_API_BASE`. Metadados institucionais (município, UF, nome) e catálogo de recursos são descobertos automaticamente via `/base/casalegislativa/` e OpenAPI.
- **Resiliência e Espelho Durável:** Persistência configurável (`STORAGE_DRIVER=sqlite`, `file` ou `memory`). Se o servidor oficial estiver instável, a API nativa continua servindo dados a partir do espelho local com cabeçalho `X-Data-Source: mirror`.
- **Sincronização Permanente:** Endpoints para sincronização completa e incremental (`/api/v1/sync` protegido por `CRON_SECRET`), com relatório público de status (`/api/v1/sync/status`).
- **Segurança Rigorosa & LGPD:**
  - Chaves de API transmitidas exclusivamente via cabeçalho (`x-api-key` ou `Authorization: Bearer`), comparadas em tempo constante com suporte a hashes SHA-256.
  - Modos configuráveis: `API_ACCESS_MODE=open` (leitura pública com rate limit) ou `API_ACCESS_MODE=keyed` (chave obrigatória).
  - O frontend do app utiliza sessão assinada via HMAC (`paflegis_session`), sem expor credenciais no navegador e sem confiar em cabeçalhos forjáveis.
  - Sanitização dinâmica de IPs de origem e mascaramento automático de campos pessoais sensíveis (LGPD).
- **Protocolo de Atendimento Atômico:** Formulário de contato emite protocolo `AAAA-NNNNNN` com incremento atômico persistente que sobrevive a reinicializações e cold starts.
- **Streaming de Mídia (`/api/media/*`):** Entrega PDFs e gravações com cabeçalhos HTTP adequados e proteção contra SSRF e path traversal.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework Full-Stack | Next.js 16+ (App Router) |
| Linguagem | TypeScript & React 19 |
| Estilização | Bootstrap 5 + Lucide React |
| Persistência | SQLite Nativo (Node 22 `node:sqlite`), JSON ou Memória |
| IA Cívica Opcional | Google Gemini via `@google/genai` (`GEMINI_API_KEY`) |
| Deploy | Docker, Google Cloud Run, Vercel ou Servidor Próprio |

---

## Estrutura do Projeto

```
paflegis/
├── app/                        # Next.js App Router (Páginas e API Route Handlers)
│   ├── api/                    # API Nativa Espelhada e Rotas Especializadas
│   │   ├── [...path]/          # Catch-all dinâmico que espelha os recursos do SAPL
│   │   ├── media/[...path]/    # Streaming seguro e cache durável de PDFs e anexos
│   │   ├── openapi.json/       # Especificação OpenAPI 3.0 gerada dinamicamente
│   │   └── v1/                 # Endpoints agregados (materias, normas, sessoes, sync, etc.)
│   │       ├── ai/resumo/      # Resumo cívico em linguagem simples com Google Gemini
│   │       ├── contato/        # Formulário com protocolo atômico persistente
│   │       ├── endpoints/      # Catálogo dinâmico de endpoints descobertos
│   │       ├── estatisticas/   # Contagens reais (sem dados fictícios)
│   │       ├── health/         # Diagnóstico seguro de integridade e latência
│   │       └── sync/           # Agendamento e status de sincronização
│   ├── materias/               # Consulta e detalhes de matérias legislativas
│   ├── normas/                 # Legislação municipal (leis, decretos, resoluções)
│   ├── sessoes/                # Sessões plenárias, pautas, atas e vídeos
│   ├── parlamentares/          # Vereadores e mesa diretora
│   ├── comissoes/              # Comissões parlamentares e reuniões
│   ├── audiencias/             # Audiências públicas
│   ├── busca/                  # Busca unificada global
│   ├── dados-publicos/         # Explorador genérico de recursos e dados abertos
│   ├── api-docs/               # Swagger UI e documentação interativa
│   ├── sobre/                  # Propósito cívico e declaração de independência
│   └── contato/                # Atendimento com protocolo persistente
├── lib/                        # Núcleo de lógica e serviços compartilhados
│   ├── config/                 # Leitura centralizada de variáveis com fallbacks e descoberta
│   ├── sanitization/           # Substituição dinâmica de IPs e proteção LGPD
│   ├── storage/                # Camada com drivers trocáveis (sqlite, file, memory)
│   ├── auth/                   # Autenticação por chave e sessão segura HMAC
│   ├── sync/                   # Motor de sincronização permanente
│   └── sapl/                   # Conector SAPL, descoberta e cache real
├── scripts/                    # Utilitários de pré-carga e teste de paridade
└── public/                     # Ativos estáticos e Swagger UI
```

---

## Configuração Rápida (.env)

Copie o modelo de variáveis de ambiente:

```bash
cp .env.example .env.local
```

### Principais Variáveis:

| Variável | Descrição | Padrão |
|---|---|---|
| `SAPL_API_BASE` | URL da API REST do SAPL desejado | `https://sapl.pedroafonso.to.leg.br/api` |
| `API_KEYS_PERMITIDAS` | Chaves ou hashes SHA-256 autorizados | Vazio |
| `API_ACCESS_MODE` | `open` (público com rate limit) ou `keyed` | `open` |
| `STORAGE_DRIVER` | Driver de armazenamento (`sqlite`, `file`, `memory`) | `sqlite` |
| `STORAGE_PATH` | Diretório para banco SQLite e mídias | `.data` |
| `CRON_SECRET` | Chave de autorização para `POST /api/v1/sync` | `paflegis-sync-secret-default` |
| `GEMINI_API_KEY` | Chave Google Gemini para resumos com IA (opcional) | Vazio |

---

## Execução em Desenvolvimento

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Verificação de Paridade

Para verificar a integridade entre o espelho local e o SAPL de origem:

```bash
npm run verify:parity
```

---

## Deploy

### Docker / Cloud Run

```bash
docker build -t paflegis .
docker run -p 3000:3000 -v paflegis_data:/app/.data paflegis
```

Ou via `docker-compose`:

```bash
docker-compose up -d
```

### Vercel

O projeto está configurado nativamente com `vercel.json` e rotas de cron automáticas em `/api/v1/sync`.
