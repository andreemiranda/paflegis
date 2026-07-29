/**
 * lib/openApiSpec.ts — Especificação OpenAPI 3.0 para documentação e endpoint /openapi.json.
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Paflegis Public API - Pedro Afonso - TO',
    version: '1.0.0',
    description:
      'API pública otimizada e normalizada do Paflegis. ATENÇÃO: Todas as requisições às rotas de dados /api/v1/* exigem obrigatoriamente a inclusão do cabeçalho `x-api-key`. Exemplo cURL: `curl -H "x-api-key: SUA_CHAVE" https://paflegis.vercel.app/api/v1/materias`. Para solicitar uma chave de parceiro para seu aplicativo externo, utilize o formulário na aba de Contato do Paflegis.',
    contact: {
      name: 'Paflegis - Consulta Pública Legislativa',
      url: 'https://paflegis.vercel.app',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Servidor Proxy e Agregador Paflegis',
    },
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Chave de API necessária para todas as rotas de dados /api/v1/*. Envie o cabeçalho x-api-key com sua chave autorizada.',
      },
    },
  },
  security: [
    { ApiKeyAuth: [] }
  ],
  paths: {
    '/materias': {
      get: {
        summary: 'Listar Matérias Legislativas',
        description: 'Retorna matérias legislativas com filtros opcionais de busca, tipo, ano e situação.',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' }, description: 'Termo de busca na ementa ou autor' },
          { name: 'tipo', in: 'query', schema: { type: 'string' }, description: 'Sigla ou ID do tipo de matéria' },
          { name: 'ano', in: 'query', schema: { type: 'string' }, description: 'Ano de apresentação' },
        ],
        responses: {
          '200': { description: 'Lista de matérias legislativas' },
        },
      },
    },
    '/materias/{id}': {
      get: {
        summary: 'Obter Detalhe de Matéria Legislativa',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Detalhes da matéria legislativa' },
          '404': { description: 'Matéria não encontrada' },
        },
      },
    },
    '/normas': {
      get: {
        summary: 'Listar Normas Jurídicas',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' } },
          { name: 'tipo', in: 'query', schema: { type: 'string' } },
          { name: 'ano', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Lista de normas jurídicas' },
        },
      },
    },
    '/normas/{id}': {
      get: {
        summary: 'Obter Detalhe de Norma Jurídica',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Detalhes da norma jurídica' },
          '404': { description: 'Norma não encontrada' },
        },
      },
    },
    '/sessoes': {
      get: {
        summary: 'Listar Sessões Plenárias',
        parameters: [
          { name: 'busca', in: 'query', schema: { type: 'string' } },
          { name: 'ano', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Lista de sessões plenárias' },
        },
      },
    },
    '/estatisticas': {
      get: {
        summary: 'Obter Estatísticas Legislativas',
        responses: {
          '200': { description: 'Totais e consolidados por tipo de matéria, norma e sessões' },
        },
      },
    },
  },
};
