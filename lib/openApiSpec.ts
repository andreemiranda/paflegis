/**
 * lib/openApiSpec.ts — Especificação OpenAPI 3.0 para documentação e endpoint /openapi.json.
 */

export const openApiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Paflegis Public API - Pedro Afonso - TO',
    version: '1.0.0',
    description:
      'API pública otimizada e normalizada do Paflegis para a Câmara Municipal de Pedro Afonso - TO. Todas as URLs de documentos, anexos e rotas retornadas pelo SAPL legado têm seus IPs brutos (64.23.167.191) automaticamente normalizados para o domínio público oficial seguro HTTPS.',
    contact: {
      name: 'Paflegis - Consulta Pública Legislativa',
      url: 'https://sapl.pedroafonso.to.leg.br',
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
        description:
          'Chave de API para controle de tráfego de integradores parceiros em /api/v1/*. Envie o cabeçalho x-api-key quando solicitado.',
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    '/endpoints': {
      get: {
        summary: 'Catálogo dos 129 Endpoints Públicos do SAPL',
        description:
          'Retorna o mapeamento completo dos 129 endpoints da API pública do SAPL, com substituição automática do IP 64.23.167.191 pelas variáveis de domínio e URL base configuradas.',
        parameters: [
          {
            name: 'format',
            in: 'query',
            schema: { type: 'string', enum: ['raw', 'template', 'snippet'] },
            description:
              'Formato do retorno: template (retorna o mapa com [NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]), raw (apenas chaves e URLs), ou padrão (catálogo estruturado enriquecido).',
          },
          {
            name: 'modulo',
            in: 'query',
            schema: { type: 'string' },
            description:
              'Filtra por módulo específico (materia, norma, sessao, parlamentares, comissoes, audiencia, protocoloadm, etc.)',
          },
        ],
        responses: {
          '200': { description: 'Catálogo de endpoints mapeados e sanitizados' },
        },
      },
    },
    '/materias': {
      get: {
        summary: 'Listar Matérias Legislativas',
        description:
          'Retorna matérias legislativas com filtros opcionais de busca, tipo, ano e situação, com URLs de textos originais e anexos normalizadas.',
        parameters: [
          {
            name: 'busca',
            in: 'query',
            schema: { type: 'string' },
            description: 'Termo de busca na ementa ou autor',
          },
          {
            name: 'tipo',
            in: 'query',
            schema: { type: 'string' },
            description: 'Sigla ou ID do tipo de matéria',
          },
          {
            name: 'ano',
            in: 'query',
            schema: { type: 'string' },
            description: 'Ano de apresentação',
          },
          {
            name: 'pagina',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Número da página',
          },
          {
            name: 'limite',
            in: 'query',
            schema: { type: 'integer' },
            description: 'Quantidade por página (padrão: 10)',
          },
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
        description:
          'Retorna leis, decretos, resoluções e normas municipais de Pedro Afonso com URLs integrais normalizadas.',
        parameters: [
          {
            name: 'busca',
            in: 'query',
            schema: { type: 'string' },
            description: 'Termo de busca na ementa',
          },
          {
            name: 'tipo',
            in: 'query',
            schema: { type: 'string' },
            description: 'ID ou descrição do tipo de norma',
          },
          {
            name: 'ano',
            in: 'query',
            schema: { type: 'string' },
            description: 'Ano da norma',
          },
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
          {
            name: 'ano',
            in: 'query',
            schema: { type: 'string' },
            description: 'Ano das sessões',
          },
          {
            name: 'busca',
            in: 'query',
            schema: { type: 'string' },
            description: 'Termo de busca',
          },
        ],
        responses: {
          '200': { description: 'Lista de sessões plenárias' },
        },
      },
    },
    '/sessoes/{id}': {
      get: {
        summary: 'Obter Detalhe de Sessão Plenária',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Detalhes da sessão' },
          '404': { description: 'Sessão não encontrada' },
        },
      },
    },
    '/estatisticas': {
      get: {
        summary: 'Obter Estatísticas Legislativas',
        responses: {
          '200': {
            description: 'Totais e consolidados por tipo de matéria, norma e sessões',
          },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Verificação de Saúde e Diagnóstico de Conexão',
        responses: {
          '200': {
            description:
              'Status da conectividade com o SAPL, latência e diagnóstico da substituição de IP.',
          },
        },
      },
    },
  },
};
