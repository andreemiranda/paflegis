/**
 * lib/openApiSpec.ts — Especificação OpenAPI 3.0 dinâmica para documentação e endpoints /api/openapi.json e /api-docs.
 */

import { getConfig } from '@/lib/config';

export function getDynamicOpenApiSpec(appOrigin = '') {
  const config = getConfig();

  return {
    openapi: '3.0.0',
    info: {
      title: `${config.siteName} — API Pública & Espelho Nativo`,
      version: '2.0.0',
      description: `API pública e espelho nativo da ${config.orgName} (${config.orgCity} - ${config.orgUf}). Fornece acesso estruturado, normalizado e resiliente a matérias legislativas, normas jurídicas, sessões plenárias, parlamentares e documentos oficiais.`,
      contact: {
        name: config.siteName,
        url: config.saplPublicDomain,
      },
    },
    servers: [
      {
        url: appOrigin ? `${appOrigin}/api` : '/api',
        description: 'API Nativa Espelhada do SAPL (somente leitura)',
      },
      {
        url: appOrigin ? `${appOrigin}/api/v1` : '/api/v1',
        description: 'Rotas Agregadas e Otimizadas Paflegis v1',
      },
    ],
    components: {
      securitySchemes: {
        ApiKeyHeader: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'Chave de API enviada pelo cabeçalho x-api-key para clientes e integradores externos.',
        },
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Token de autenticação enviado pelo cabeçalho Authorization: Bearer <chave>.',
        },
      },
    },
    security: [{ ApiKeyHeader: [] }, { BearerAuth: [] }],
    paths: {
      '/materia/materialegislativa/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Listagem de Matérias Legislativas',
          description: 'Espelha a API nativa do SAPL com paginação, busca e filtros.',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Número da página' },
            { name: 'page_size', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Itens por página' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Busca textual na ementa' },
            { name: 'ano', in: 'query', schema: { type: 'integer' }, description: 'Ano de apresentação' },
            { name: 'tipo', in: 'query', schema: { type: 'integer' }, description: 'ID do tipo de matéria' },
          ],
          responses: {
            '200': { description: 'Lista paginada de matérias com links reescritos' },
            '401': { description: 'Chave de API não fornecida ou inválida (no modo keyed)' },
          },
        },
      },
      '/materia/materialegislativa/{id}/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Detalhe de Matéria Legislativa por ID',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID da matéria' },
          ],
          responses: {
            '200': { description: 'Detalhes da matéria' },
            '404': { description: 'Matéria não encontrada' },
          },
        },
      },
      '/norma/normajuridica/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Legislação e Normas Jurídicas',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'search', in: 'query', schema: { type: 'string' } },
            { name: 'ano', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Lista de normas jurídicas' } },
        },
      },
      '/sessao/sessaoplenaria/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Sessões Plenárias',
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer' } },
            { name: 'data_inicio__year', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { '200': { description: 'Lista de sessões plenárias' } },
        },
      },
      '/parlamentares/parlamentar/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Parlamentares e Vereadores',
          responses: { '200': { description: 'Lista de parlamentares' } },
        },
      },
      '/comissoes/comissao/': {
        get: {
          tags: ['Espelho Nativo SAPL'],
          summary: 'Comissões Parlamentares',
          responses: { '200': { description: 'Lista de comissões' } },
        },
      },
      '/media/{path}': {
        get: {
          tags: ['Mídia e Documentos'],
          summary: 'Streaming de Documentos e PDFs',
          description: 'Entrega anexos, atas e redações em PDF com cache e suporte a streaming parcial (Range).',
          parameters: [
            { name: 'path', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Documento binário' },
            '206': { description: 'Conteúdo parcial (Range streaming)' },
          },
        },
      },
      '/v1/endpoints': {
        get: {
          tags: ['Catálogo'],
          summary: 'Catálogo Dinâmico de Endpoints do SAPL',
          description: 'Lista todos os endpoints descobertos na instância conectada do SAPL.',
          responses: { '200': { description: 'Catálogo estruturado' } },
        },
      },
      '/v1/sync/status': {
        get: {
          tags: ['Sincronização & Saúde'],
          summary: 'Status de Sincronização do Espelho Local',
          responses: { '200': { description: 'Contagens e integridade do espelho' } },
        },
      },
      '/v1/health': {
        get: {
          tags: ['Sincronização & Saúde'],
          summary: 'Verificação de Integridade do Sistema',
          responses: { '200': { description: 'Status de conectividade' } },
        },
      },
    },
  };
}

export const openApiSpec = getDynamicOpenApiSpec();
