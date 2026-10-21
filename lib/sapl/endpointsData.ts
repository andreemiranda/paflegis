/**
 * lib/sapl/endpointsData.ts
 * Catálogo e mapeamento dos 129 endpoints públicos da API do SAPL de Pedro Afonso - TO.
 * Permite a substituição automática do IP bruto de origem (http://64.23.167.191)
 * pelas variáveis de ambiente configuradas para a URL base e o domínio público da API.
 */

export interface SaplEndpointInfo {
  key: string;
  path: string;
  module: string;
  description: string;
}

export const ALL_129_SAPL_ENDPOINT_KEYS: string[] = [
  'audiencia/tipoaudienciapublica',
  'audiencia/audienciapublica',
  'audiencia/anexoaudienciapublica',
  'contenttypes/contenttype',
  'base/casalegislativa',
  'base/appconfig',
  'base/tipoautor',
  'base/autor',
  'base/operadorautor',
  'base/auditlog',
  'base/metadata',
  'comissoes/tipocomissao',
  'comissoes/comissao',
  'comissoes/periodo',
  'comissoes/cargocomissao',
  'comissoes/composicao',
  'comissoes/participacao',
  'comissoes/reuniao',
  'comissoes/documentoacessorio',
  'compilacao/perfilestruturaltextoarticulado',
  'compilacao/tipotextoarticulado',
  'compilacao/textoarticulado',
  'compilacao/tiponota',
  'compilacao/tipovide',
  'compilacao/tipodispositivo',
  'compilacao/tipodispositivorelationship',
  'compilacao/tipopublicacao',
  'compilacao/veiculopublicacao',
  'compilacao/publicacao',
  'compilacao/dispositivo',
  'compilacao/vide',
  'compilacao/nota',
  'materia/tipoproposicao',
  'materia/tipomaterialegislativa',
  'materia/regimetramitacao',
  'materia/origem',
  'materia/materialegislativa',
  'materia/autoria',
  'materia/acompanhamentomateria',
  'materia/pautareuniao',
  'materia/anexada',
  'materia/assuntomateria',
  'materia/despachoinicial',
  'materia/tipodocumento',
  'materia/documentoacessorio',
  'materia/materiaassunto',
  'materia/numeracao',
  'materia/orgao',
  'materia/tipofimrelatoria',
  'materia/relatoria',
  'materia/parecer',
  'materia/proposicao',
  'materia/historicoproposicao',
  'materia/statustramitacao',
  'materia/unidadetramitacao',
  'materia/tramitacao',
  'materia/materiaemtramitacao',
  'materia/configetiquetamaterialegislativa',
  'norma/assuntonorma',
  'norma/tiponormajuridica',
  'norma/normajuridica',
  'norma/normaestatisticas',
  'norma/viewnormasestatisticas',
  'norma/autorianorma',
  'norma/legislacaocitada',
  'norma/tipovinculonormajuridica',
  'norma/normarelacionada',
  'norma/anexonormajuridica',
  'painel/painel',
  'painel/cronometro',
  'parlamentares/legislatura',
  'parlamentares/sessaolegislativa',
  'parlamentares/coligacao',
  'parlamentares/partido',
  'parlamentares/composicaocoligacao',
  'parlamentares/nivelinstrucao',
  'parlamentares/situacaomilitar',
  'parlamentares/parlamentar',
  'parlamentares/tipodependente',
  'parlamentares/dependente',
  'parlamentares/filiacao',
  'parlamentares/tipoafastamento',
  'parlamentares/mandato',
  'parlamentares/cargomesa',
  'parlamentares/mesadiretora',
  'parlamentares/composicaomesa',
  'parlamentares/frente',
  'parlamentares/frentecargo',
  'parlamentares/frenteparlamentar',
  'parlamentares/votante',
  'parlamentares/bloco',
  'parlamentares/blococargo',
  'parlamentares/blocomembro',
  'protocoloadm/tipodocumentoadministrativo',
  'protocoloadm/protocolo',
  'protocoloadm/documentoadministrativo',
  'protocoloadm/documentoacessorioadministrativo',
  'protocoloadm/statustramitacaoadministrativo',
  'protocoloadm/tramitacaoadministrativo',
  'protocoloadm/anexado',
  'protocoloadm/vinculodocadminmateria',
  'protocoloadm/acompanhamentodocumento',
  'sessao/cargobancada',
  'sessao/bancada',
  'sessao/tiposessaoplenaria',
  'sessao/sessaoplenaria',
  'sessao/expedientemateria',
  'sessao/tipoexpediente',
  'sessao/expedientesessao',
  'sessao/ocorrenciasessao',
  'sessao/consideracoesfinais',
  'sessao/integrantemesa',
  'sessao/orador',
  'sessao/oradorexpediente',
  'sessao/oradorordemdia',
  'sessao/ordemdia',
  'sessao/presencaordemdia',
  'sessao/tiporesultadovotacao',
  'sessao/registrovotacao',
  'sessao/votoparlamentar',
  'sessao/sessaoplenariapresenca',
  'sessao/resumoordenacao',
  'sessao/tiporetiradapauta',
  'sessao/tipojustificativa',
  'sessao/justificativaausencia',
  'sessao/retiradapauta',
  'sessao/registroleitura',
  'sessao/correspondencia',
  'sessao-plenaria',
];

export const MODULE_NAMES: Record<string, string> = {
  audiencia: 'Audiências Públicas',
  base: 'Configurações e Autores',
  comissoes: 'Comissões Parlamentares',
  compilacao: 'Textos Articulados e Publicações',
  contenttypes: 'Modelos de Conteúdo',
  materia: 'Matérias e Proposições Legislativas',
  norma: 'Normas Jurídicas e Leis',
  painel: 'Painel Eletrônico e Cronômetro',
  parlamentares: 'Parlamentares, Mesa e Mandatos',
  protocoloadm: 'Protocolo e Documentos Administrativos',
  sessao: 'Sessões Plenárias e Votações',
  'sessao-plenaria': 'Sessão Plenária',
};

/** Gera o mapeamento com a URL pública resolvida a partir da base da API. */
export function buildResolvedEndpointsMap(apiBase: string): Record<string, string> {
  const cleanBase = apiBase.replace(/\/+$/, '');
  const map: Record<string, string> = {};
  for (const key of ALL_129_SAPL_ENDPOINT_KEYS) {
    map[key] = `${cleanBase}/${key}/`;
  }
  return map;
}

/** Gera o mapeamento no formato de variável de template configurada. */
export function buildTemplateEndpointsMap(prefix = '[NEXT_PUBLIC_SAPL_PUBLIC_DOMAIN]'): Record<string, string> {
  const map: Record<string, string> = {};
  for (const key of ALL_129_SAPL_ENDPOINT_KEYS) {
    map[key] = `${prefix}/${key}/`;
  }
  return map;
}
