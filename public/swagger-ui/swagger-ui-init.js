
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Paflegis Public API - Pedro Afonso - TO",
      "version": "1.0.0",
      "description": "API pública otimizada e normalizada do Paflegis, agregando dados de Matérias Legislativas, Normas Jurídicas e Sessões Plenárias de Pedro Afonso - TO. Fonte original oficial: SAPL Pedro Afonso-TO.",
      "contact": {
        "name": "Paflegis - Transparência Legislativa",
        "url": "https://sapl.pedroafonso.to.leg.br"
      }
    },
    "servers": [
      {
        "url": "/api/v1",
        "description": "Servidor Proxy e Agregador Paflegis"
      }
    ],
    "paths": {
      "/materias": {
        "get": {
          "summary": "Listar Matérias Legislativas",
          "description": "Retorna matérias legislativas com filtros opcionais de busca, tipo, ano e situação.",
          "parameters": [
            {
              "name": "busca",
              "in": "query",
              "schema": {
                "type": "string"
              },
              "description": "Termo de busca na ementa ou autor"
            },
            {
              "name": "tipo",
              "in": "query",
              "schema": {
                "type": "string"
              },
              "description": "Sigla ou ID do tipo de matéria"
            },
            {
              "name": "ano",
              "in": "query",
              "schema": {
                "type": "string"
              },
              "description": "Ano de apresentação"
            }
          ],
          "responses": {
            "200": {
              "description": "Lista de matérias legislativas"
            }
          }
        }
      },
      "/materias/{id}": {
        "get": {
          "summary": "Obter Detalhe de Matéria Legislativa",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Detalhes da matéria legislativa com documentos acessórios e tramitações"
            },
            "404": {
              "description": "Matéria não encontrada"
            }
          }
        }
      },
      "/normas": {
        "get": {
          "summary": "Listar Normas Jurídicas",
          "parameters": [
            {
              "name": "busca",
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "tipo",
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "ano",
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Lista de normas jurídicas publicadas"
            }
          }
        }
      },
      "/normas/{id}": {
        "get": {
          "summary": "Obter Detalhe de Norma Jurídica",
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Detalhes da norma jurídica e anexo integral"
            }
          }
        }
      },
      "/sessoes": {
        "get": {
          "summary": "Listar Sessões Plenárias",
          "parameters": [
            {
              "name": "busca",
              "in": "query",
              "schema": {
                "type": "string"
              }
            },
            {
              "name": "ano",
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Lista de sessões plenárias com pauta e ata"
            }
          }
        }
      },
      "/estatisticas": {
        "get": {
          "summary": "Obter Estatísticas Legislativas",
          "responses": {
            "200": {
              "description": "Totais e consolidados por tipo de matéria, norma e sessões"
            }
          }
        }
      }
    }
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}
