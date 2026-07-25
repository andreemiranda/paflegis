# Paflegis

Aplicativo civico independente de consulta as informacoes legislativas publicas do Municipio de Pedro Afonso - TO. Exibe materias legislativas, normas juridicas e sessoes plenarias obtidas via API publica do SAPL (Sistema de Apoio ao Processo Legislativo).

> **Atencao:** o Paflegis nao e o portal oficial de Pedro Afonso - TO nem de qualquer orgao governamental. E uma ferramenta civica independente, sem vinculo institucional com o Poder Publico, fundamentada na Lei de Acesso a Informacao (Lei n. 12.527/2011).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Express (proxy/agregador da API publica do SAPL) |
| IA (opcional) | Google Gemini via `@google/genai` |
| Build | Vite (frontend) + esbuild (servidor) |

---

## Estrutura do repositorio

```
paflegis/
├── src/                        # Frontend React + TypeScript
│   ├── components/             # Componentes reutilizaveis (Header, Footer, modais, etc.)
│   ├── lib/                    # Utilitarios: API SAPL, datas, URLs, consentimento LGPD, ads
│   ├── views/                  # Paginas/abas da aplicacao
│   └── types/                  # Tipos TypeScript globais
├── public/                     # Ativos estaticos servidos diretamente
│   ├── swagger-ui/             # Documentacao interativa da API REST
│   └── images/                 # Logo e demais imagens publicas
├── scripts/
│   └── post-merge.sh           # Script executado apos merge de tarefas
├── server.ts                   # Servidor Express: proxy SAPL + API Gemini + sessoes
├── index.html                  # Entry point HTML (Vite)
├── vite.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json           # Lockfile npm (unico gerenciador de pacotes suportado)
├── .env.example                # Variaveis de ambiente documentadas
├── .node-version / .nvmrc      # Node 20
├── Dockerfile                  # Build multi-stage para qualquer plataforma Docker
├── heroku.yml                  # Deploy via container no Heroku
├── Procfile                    # Deploy classico no Heroku (sem Docker)
├── render.yaml                 # Blueprint de deploy no Render
├── vercel.json                 # Configuracao de deploy no Vercel (frontend estatico)
├── netlify.toml                # Configuracao de deploy no Netlify (frontend estatico)
└── wrangler.toml               # Configuracao de deploy no Cloudflare Pages
```

---

## Como rodar localmente

### Pre-requisitos

- Node.js 20+ (versao definida em `.node-version` e `.nvmrc`)
- Chave de API do Google Gemini (opcional — sem ela o assistente de IA fica desabilitado)

### Instalacao

```bash
# 1. Clone o repositorio
git clone https://github.com/andreemiranda/paflegis.git
cd paflegis

# 2. Instale as dependencias (somente npm)
npm install

# 3. Configure as variaveis de ambiente
cp .env.example .env.local
# Edite .env.local e preencha ao menos GEMINI_API_KEY e SESSION_SECRET

# 4. Suba o servidor de desenvolvimento (Express + Vite na porta 5000)
npm run dev
```

### Variaveis de ambiente

| Variavel | Obrigatoria | Descricao |
|---|---|---|
| `GEMINI_API_KEY` | Sim (para IA) | Chave da API do Google Gemini |
| `SESSION_SECRET` | **Sim em producao** | String aleatoria longa (min. 32 chars). Gere com `openssl rand -base64 32` |
| `NODE_ENV` | Recomendado | `production` em producao, `development` localmente |
| `PORT` | Nao | Porta do servidor. Default: `5000`. Plataformas de cloud sobrescrevem automaticamente |
| `ALLOWED_ORIGINS` | Nao | Origens CORS permitidas em producao (separadas por virgula). Vazio = same-origin |
| `STATS_TTL_MS` | Nao | TTL do cache de estatisticas em ms. Default: `300000` (5 min) |

### Scripts disponveis

| Comando | Descricao |
|---|---|
| `npm run dev` | Sobe Express + Vite em modo de desenvolvimento (HMR ativo) |
| `npm run build` | Gera `dist/` com o frontend (Vite) e `dist/server.cjs` (esbuild) |
| `npm run start` | Inicia o servidor de producao a partir de `dist/server.cjs` |
| `npm run lint` | Checa erros de tipo TypeScript (`tsc --noEmit`) |

---

## Deploy

### Docker (Dockerfile + heroku.yml)

O `Dockerfile` usa build multi-stage: o stage `builder` compila o frontend e o servidor; o stage `runner` copia apenas os artefatos necessarios e roda com usuario nao-root.

```bash
# Build local
docker build -t paflegis .

# Rodar localmente
docker run -p 5000:5000 \
  -e GEMINI_API_KEY=sua_chave \
  -e SESSION_SECRET=sua_string_secreta \
  -e NODE_ENV=production \
  paflegis
```

O `heroku.yml` aponta para o `Dockerfile`, permitindo deploy via container no Heroku.

---

### Heroku (Procfile)

O `Procfile` define `web: npm run start`. O Heroku injeta `PORT` automaticamente.

Variaveis a configurar no painel (Settings > Config Vars):

```
GEMINI_API_KEY=...
SESSION_SECRET=...
NODE_ENV=production
```

---

### Render (render.yaml)

O `render.yaml` configura um Web Service Node com:

- `buildCommand: npm ci && npm run build`
- `startCommand: npm run start`
- Health check em `/api/stats`
- `SESSION_SECRET` gerado automaticamente pelo Render
- `GEMINI_API_KEY` deve ser preenchida manualmente no painel

Deploy via blueprint: conecte o repositorio no Render e selecione "Apply Blueprint".

---

### Vercel (vercel.json)

O `vercel.json` serve o **frontend estatico** gerado em `dist/`. Rotas `/api/*` precisam de um backend rodando separadamente (ex.: Render), pois o Express nao executa na Vercel nessa configuracao.

Variaveis a configurar no painel da Vercel:

```
GEMINI_API_KEY=...   # necessario apenas se o backend for hospedado na Vercel Functions
NODE_ENV=production
```

---

### Netlify (netlify.toml)

O `netlify.toml` faz publish do diretorio `dist/` com SPA fallback (`/* -> /index.html`). O backend Express **nao roda** no Netlify estatico.

O arquivo ja traz um exemplo de redirect para o backend em `/api/*` apontando para uma instancia no Render. Substitua a URL pelo seu dominio real antes de publicar.

Variaveis a configurar no painel do Netlify (Site Settings > Environment Variables):

```
NODE_ENV=production
```

---

### Cloudflare Pages (wrangler.toml)

O `wrangler.toml` configura o projeto para Cloudflare Pages com `pages_build_output_dir = "dist"` e compatibilidade com Node.js via `nodejs_compat`.

```bash
# Build local e deploy
npm run build
wrangler pages deploy dist --project-name=paflegis

# Configurar secrets
wrangler secret put GEMINI_API_KEY
wrangler secret put SESSION_SECRET
```

---

## Gerenciador de pacotes

Este projeto usa **exclusivamente npm**. O `bun.lock` foi removido intencionalmente porque estava desatualizado e causava instalacoes inconsistentes em plataformas de CI/CD. Nao adicione `bun.lock`, `yarn.lock` ou `pnpm-lock.yaml` ao repositorio.

---

## Conformidade

- **LGPD (Lei n. 13.709/2018):** politica de privacidade, politica de cookies, central de privacidade e formulario de direitos do titular implementados.
- **LAI (Lei n. 12.527/2011):** todos os dados legislativos sao de dominio publico, obtidos via API oficial do SAPL.
- **Dados:** o Paflegis nao coleta dados sensiveis. Preferencias sao armazenadas exclusivamente no `localStorage` do dispositivo do usuario.

---

## Licenca

Interface, codigo-fonte e textos originais: propriedade intelectual dos desenvolvedores do Paflegis (Lei n. 9.610/1998 e Lei n. 9.609/1998).

Dados legislativos exibidos: dominio publico - orgao legislativo de Pedro Afonso - TO - reproduzidos com fundamento na LAI.

Conteudo e dados via SAPL: [Creative Commons 4.0](https://creativecommons.org/licenses/by/4.0/) - Atribuir Fonte.
