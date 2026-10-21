# Mapeamento de Endpoints da API SAPL (Pedro Afonso - TO) para Paflegis

Base Domain Oficial: `https://sapl.pedroafonso.to.leg.br`
Swagger UI Original: `https://sapl.pedroafonso.to.leg.br/api/schema/swagger-ui/`

---

## 1. Regra de Normalização de URLs de Documentos (`normalizeDocumentUrl`)
Todas as URLs de anexos, textos integrais, atas e pautas retornadas pela API do SAPL (que eventualmente apontem para IP bruto como `http://64.23.167.191/...` ou HTTP inseguro) DEVEM ser tratadas e normalizadas para:
- Protocolo: `https://`
- Domínio: `sapl.pedroafonso.to.leg.br`
- Path mantido integralmente (ex: `/media/sapl/public/materia/2024/123/texto_integral.pdf`)

---

## 2. Endpoints Mapeados

### Pillar 1: Matérias Legislativas (`/materia`)
- `GET /api/materia/materialegislativa/`
  - Filtros: `ano`, `tipo`, `numero`, `autor`, `relator`, `situacao`, `pesquisa` (ementa/texto)
  - Campos de Anexos: `texto_original`, `texto_articulado`, `documento_acessorio_set`
- `GET /api/materia/materialegislativa/{id}/`
  - Detalhe completo da matéria
- `GET /api/materia/tipomaterialegislativa/`
  - Lista de tipos de matéria (Projeto de Lei, Requerimento, Indicação, Moção, Parecer, etc.)
- `GET /api/materia/tramitacao/`
  - Tramitações da matéria (`materia={id}`)
- `GET /api/materia/documentoacessorio/`
  - Documentos anexos/acessórios vinculados (`materia={id}`)

### Pillar 2: Normas Jurídicas (`/norma`)
- `GET /api/norma/normajuridica/`
  - Filtros: `ano`, `tipo`, `numero`, `assunto`, `situacao`, `pesquisa`
  - Campos de Anexos: `texto_integral`, `anexo_set`
- `GET /api/norma/normajuridica/{id}/`
  - Detalhe da norma jurídica
- `GET /api/norma/tiponormajuridica/`
  - Lista de tipos de normas (Lei Ordinária, Lei Complementar, Decreto, Resolução, Portaria)

### Pillar 3: Sessões Plenárias (`/sessao`)
- `GET /api/sessao/sessaoplenaria/`
  - Filtros: `data_inicio`, `data_fim`, `tipo`, `pesquisa`
  - Campos de Anexos: `pauta`, `ata`, `anexo_set`
- `GET /api/sessao/sessaoplenaria/{id}/`
  - Detalhes da sessão
- `GET /api/sessao/ordemdia/`
  - Itens da ordem do dia da sessão (`sessao={id}`)
- `GET /api/sessao/expediente/`
  - Expedientes da sessão (`sessao={id}`)
- `GET /api/sessao/presencasessao/`
  - Presença dos vereadores na sessão (`sessao={id}`)

---

## 3. Proxy Paflegis (`/api/v1/`)
O backend Node/Express do Paflegis provê a API normalizada:
- `GET /api/v1/materias`
- `GET /api/v1/materias/:id`
- `GET /api/v1/normas`
- `GET /api/v1/normas/:id`
- `GET /api/v1/sessoes`
- `GET /api/v1/sessoes/:id`
- `GET /api/v1/tipos/materias`
- `GET /api/v1/tipos/normas`
- `GET /api/v1/estatisticas`
- `GET /api-docs` (Swagger UI Interativo Paflegis)
- `GET /api/openapi.json` (OpenAPI Spec em JSON)
