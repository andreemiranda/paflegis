# Paflegis

Aplicativo cívico independente de consulta às informações legislativas públicas do Município de Pedro Afonso - TO. Exibe matérias legislativas, normas jurídicas e sessões plenárias obtidas via API pública do SAPL (Sistema de Apoio ao Processo Legislativo).

> **Atenção:** O Paflegis não é o portal oficial da Câmara Municipal de Pedro Afonso - TO nem de qualquer órgão governamental. É uma iniciativa cívica independente, sem vínculo institucional com o Poder Público, fundamentada na Lei de Acesso à Informação (Lei Federal nº 12.527/2011).

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Framework Full-Stack | Next.js (App Router) |
| Linguagem | TypeScript & React |
| Estilização | Bootstrap 5 + Lucide Icons |
| Backend & API | Route Handlers Nativos (`app/api/v1/*`) |
| IA Cívica | Google Gemini via `@google/genai` |
| Hospedagem & Deploy | Vercel (Next.js Serverless Platform) |

---

## Estrutura do Projeto

```
paflegis/
├── app/                        # Next.js App Router (Páginas e Route Handlers)
│   ├── api/v1/                 # Endpoints REST normalizados
│   │   ├── materias/           # Rotas de listagem e detalhe de matérias
│   │   ├── normas/             # Rotas de listagem e detalhe de normas
│   │   ├── sessoes/            # Rotas de listagem e detalhe de sessões
│   │   ├── estatisticas/       # Totais consolidados do município
│   │   ├── health/             # Diagnóstico de integridade e latência
│   │   ├── contato/            # Envio de formulário com protocolo
│   │   ├── chat/               # Assistente de IA com Google Gemini
│   │   ├── openapi.json/       # Especificação OpenAPI 3.0
│   │   └── seo-audit/          # Monitoramento de SEO e conexões
│   ├── materias/               # Páginas de listagem e detalhe de matérias
│   ├── normas/                 # Páginas de legislação municipal
│   ├── sessoes/                # Páginas de sessões plenárias e vídeos
│   ├── sobre/                  # Informações sobre o projeto cívico
│   ├── contato/                # Formulário de contato e suporte
│   ├── api-docs/               # Documentação interativa e cURL snippets
│   ├── privacidade/            # Política de Privacidade e Central LGPD
│   ├── cookies/                # Política de Cookies
│   ├── termos/                 # Termos de Uso
│   ├── aviso-legal/            # Isenção de responsabilidade oficial
│   ├── dados-publicos/         # Licenciamento e abertura de dados
│   ├── layout.tsx              # Layout mestre com acessibilidade e navegação
│   ├── page.tsx                # Dashboard inicial e busca rápida
│   ├── sitemap.ts              # Sitemap XML dinâmico
│   └── robots.ts               # Configuração de robôs e indexação
├── components/                 # Componentes reutilizáveis (Header, Footer, Cards, Modais)
├── lib/                        # Módulos de infraestrutura e lógica compartilhada
│   ├── sapl/                   # Conector SAPL e cache com fallback de resiliência
│   ├── auth/                   # Validação de API keys com bypass para same-origin
│   ├── gemini/                 # Cliente de Inteligência Artificial Google Gemini
│   ├── mail/                   # Disparo de e-mails via Nodemailer
│   └── rateLimiter.ts          # Controle de taxa de requisições
├── public/                     # Ativos estáticos públicos (logos, imagens, manifests)
├── types/                      # Definições de tipos TypeScript globais
├── next.config.mjs             # Configuração do Next.js
└── package.json                # Dependências e scripts do projeto
```

---

## Como Rodar Localmente

### Pré-requisitos

- Node.js 20+
- Chave de API do Google Gemini (opcional, para o assistente de IA)

### Instalação

```bash
# 1. Clone o repositório
git clone https://github.com/andreemiranda/paflegis.git
cd paflegis

# 2. Instale as dependências (somente npm)
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local e adicione sua chave GEMINI_API_KEY (opcional)

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `GEMINI_API_KEY` | Sim (para IA) | Chave da API do Google Gemini |
| `API_KEYS` | Opcional | Chaves autorizadas de parceiros externos (separadas por vírgula) |
| `EMAIL_USER` | Opcional | E-mail Gmail que envia mensagens de contato via SMTP |
| `EMAIL_APP_PASSWORD` | Opcional | Senha de aplicativo de 16 dígitos gerada no Google |
| `EMAIL_DESTINO` | Opcional | E-mail que recebe as mensagens do formulário |

---

## Autenticação e Consumo da API

- **Navegação no Portal (Mesma Origem):** As requisições originadas pelo próprio frontend passam automaticamente pelo gate de autenticação (`same-origin`), garantindo transparência total sem necessidade de login.
- **Aplicações e Parceiros Externos:** Requisições de terceiros para `/api/v1/*` requerem o cabeçalho `x-api-key`. Chaves gratuitas podem ser solicitadas através do canal de contato do portal.

---

## Deploy em Produção (Vercel)

O projeto foi estruturado para deploy contínuo e sem fricção na **Vercel**:

1. Conecte seu repositório GitHub ao painel da Vercel.
2. O framework Next.js é detectado automaticamente.
3. Configure as variáveis de ambiente necessárias em **Project Settings > Environment Variables**.
4. O deploy ocorre automaticamente a cada push na branch principal.

---

## Conformidade Legal e Privacidade

- **LGPD (Lei nº 13.709/2018):** Política de privacidade, política de cookies, central de privacidade e formulário de exercício de direitos do titular implementados.
- **LAI (Lei nº 12.527/2011):** Todos os dados legislativos exibidos são de domínio público, obtidos via API oficial do SAPL.
- **Privacidade Local:** Preferências de acessibilidade (como alto contraste) são armazenadas localmente no dispositivo do usuário (`localStorage`).

---

## Licença

- **Código-fonte:** Licença MIT.
- **Dados legislativos:** Domínio público — Câmara Municipal de Pedro Afonso - TO.
