# Paflegis

Aplicativo cívico independente de consulta às informações legislativas públicas do Município de Pedro Afonso - TO. Exibe matérias legislativas, normas jurídicas e sessões plenárias obtidas via API pública do SAPL (Sistema de Apoio ao Processo Legislativo).

> **Atenção:** O Paflegis não é o portal oficial da Câmara Municipal de Pedro Afonso - TO nem de qualquer órgão governamental. É uma ferramenta cívica independente, sem vínculo institucional com o Poder Público, fundamentada na Lei de Acesso à Informação (Lei nº 12.527/2011).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend (Vercel) | Serverless Functions Node.js (`api/index.ts`) |
| Backend (Local Dev) | Express (`server.ts`) |
| IA (opcional) | Google Gemini via `@google/genai` |
| Build | Vite (frontend) + esbuild (servidor local) |

---

## Estrutura do Repositório

```
paflegis/
├── src/                        # Frontend React + TypeScript
│   ├── components/             # Componentes reutilizáveis (Header, Footer, modais, etc.)
│   ├── lib/                    # Utilitários: API SAPL, datas, URLs, consentimento LGPD, ads
│   ├── views/                  # Páginas/abas da aplicação
│   └── types/                  # Tipos TypeScript globais
├── public/                     # Ativos estáticos servidos diretamente
│   ├── swagger-ui/             # Documentação interativa da API REST
│   └── images/                 # Logo e demais imagens públicas
├── api/                        # Backend Serverless para Vercel
│   └── index.ts                # Handler unificado de rotas /api/* na Vercel
├── lib/                        # Módulos compartilhados de resiliência e backend
│   ├── saplBackend.ts          # safeFetchWithRetry, checkSaplHealth e normalizadores
│   └── fallbackCache.ts        # Cache resiliente em memória e disco (/tmp)
├── server.ts                   # Servidor Express para desenvolvimento local
├── index.html                  # Entry point HTML (Vite)
├── vite.config.ts              # Configuração do Vite
├── tsconfig.json               # Configuração TypeScript
├── vercel.json                 # Configuração de rotas e Serverless Functions na Vercel
├── package.json
└── package-lock.json           # Lockfile npm (único gerenciador de pacotes suportado)
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Chave de API do Google Gemini (opcional — sem ela o assistente de IA fica desabilitado)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/andreemiranda/paflegis.git
cd paflegis

# 2. Instale as dependências (somente npm)
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e preencha as variáveis desejadas

# 4. Suba o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Sim (para IA) | Chave da API do Google Gemini |
| `SESSION_SECRET` | Sim (no servidor local) | String aleatória longa para assinatura de sessão |
| `EMAIL_USER` | Opcional | E-mail Gmail que envia mensagens de contato via SMTP |
| `EMAIL_APP_PASSWORD` | Opcional | Senha de aplicativo de 16 dígitos gerada pelo Google |
| `EMAIL_DESTINO` | Opcional | E-mail que recebe as mensagens do formulário de contato |
| `ALLOWED_ORIGINS` | Opcional | Origens CORS permitidas em produção (separadas por vírgula) |
| `STATS_TTL_MS` | Opcional | TTL do cache de estatísticas em ms (padrão: 300000 = 5 min) |
| `LIST_CACHE_TTL_MS` | Opcional | TTL do cache de listagens em ms (padrão: 180000 = 3 min) |

### Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia o servidor local de desenvolvimento |
| `npm run build` | Compila o frontend (Vite) e o servidor (esbuild) |
| `npm run start` | Inicia o servidor de produção compilado (`dist/server.cjs`) |
| `npm run lint` | Valida erros de tipo TypeScript (`tsc --noEmit`) |

---

## Deploy em Produção (Vercel)

O Paflegis roda em produção na **Vercel** utilizando **Vercel Serverless Functions** (`api/index.ts`) para rotas `/api/*` e o frontend estático servido a partir de `dist/`.

### Arquitetura de Resiliência do SAPL

- **Domínio Oficial**: Toda comunicação externa é realizada via HTTPS seguro com o domínio oficial `https://sapl.pedroafonso.to.leg.br/`.
- **Prevenção de Timeout (Fail-Fast)**: Funções Serverless possuem limite estrito de execução (10 segundos no plano padrão). O helper `safeFetchWithRetry` utiliza timeout controlado (4000ms com 1 retry rápido de 300ms de backoff para listagens e detalhes; 3500ms sem retentativa para contagens/sub-recursos), prevenindo estouro do tempo de execução da função.
- **Cache Resiliente**: Respostas do SAPL são armazenadas na memória da instância (`globalThis`) e persistidas em disco (`/tmp/paflegis_cache`). Caso o SAPL externo apresente lentidão momentânea, o Paflegis responde com dados de cache íntegros.
- **Logging Estruturado (`slog`)**: Todas as requisições, retentativas e eventuais indisponibilidades do SAPL são registradas em formato JSON com contexto, endpoint e latência, facilitando o diagnóstico no painel de logs da Vercel.
- **Health Check & Diagnóstico**: Endpoint `/api/v1/health` fornece diagnóstico em tempo real da conectividade e tempo de resposta do SAPL.

### Variáveis no Painel da Vercel (Settings > Environment Variables)

```
GEMINI_API_KEY=...       # Chave da Google Gemini AI
EMAIL_USER=...           # E-mail Gmail de envio (ex: contato@exemplo.com)
EMAIL_APP_PASSWORD=...   # Senha de aplicativo de 16 dígitos gerada no Google
EMAIL_DESTINO=...        # E-mail que recebe os contatos enviados pelos usuários
ALLOWED_ORIGINS=...      # Domínio frontend autorizado (ex: paflegis.vercel.app)
NODE_ENV=production
```

---

## Conformidade Legal e Privacidade

- **LGPD (Lei nº 13.709/2018):** Política de privacidade, política de cookies, central de privacidade e formulário de exercício de direitos do titular implementados.
- **LAI (Lei nº 12.527/2011):** Todos os dados legislativos exibidos são de domínio público, obtidos via API oficial do SAPL.
- **Dados:** O Paflegis não coleta dados sensíveis. Preferências locais são armazenadas no navegador do usuário via `localStorage`.

---

## Licença

- **Interface e código-fonte:** Propriedade intelectual dos desenvolvedores do Paflegis (Lei nº 9.610/1998 e Lei nº 9.609/1998).
- **Dados legislativos:** Domínio público — Câmara Municipal de Pedro Afonso - TO — reproduzidos com fundamento na LAI.
- **Conteúdo via SAPL:** [Creative Commons 4.0](https://creativecommons.org/licenses/by/4.0/) - Atribuir Fonte.
