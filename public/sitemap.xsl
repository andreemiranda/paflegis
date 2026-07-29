<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="pt-BR">
      <head>
        <title>Mapa do Site XML (Sitemap) - Paflegis</title>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <style type="text/css">
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 24px;
          }
          .container {
            max-width: 960px;
            margin: 0 auto;
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            color: #38bdf8;
            margin-top: 0;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          p {
            font-size: 13px;
            color: #94a3b8;
            margin-bottom: 20px;
            line-height: 1.5;
          }
          .stats {
            display: flex;
            gap: 16px;
            background: #0f172a;
            padding: 12px 16px;
            border-radius: 8px;
            border: 1px solid #334155;
            margin-bottom: 20px;
            font-size: 13px;
          }
          .stat-item {
            display: flex;
            gap: 6px;
          }
          .stat-label {
            color: #64748b;
          }
          .stat-value {
            font-weight: bold;
            color: #38bdf8;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 10px;
          }
          th {
            background-color: #0f172a;
            color: #cbd5e1;
            text-align: left;
            padding: 10px 14px;
            font-weight: 600;
            border-bottom: 2px solid #334155;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.5px;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #334155;
            word-break: break-all;
          }
          tr:hover {
            background-color: #334155;
          }
          a {
            color: #38bdf8;
            text-decoration: none;
            font-weight: 500;
          }
          a:hover {
            text-decoration: underline;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            background: #0284c7;
            color: #ffffff;
          }
          .footer {
            margin-top: 24px;
            font-size: 11px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid #334155;
            padding-top: 16px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>
            <span>🗺️ Mapa do Site XML - Paflegis</span>
          </h1>
          <p>
            Este é o arquivo de índice XML estilizado para motores de busca (Google, Bing). Ele lista os principais endereços e seções do aplicativo para indexação.
          </p>

          <div class="stats">
            <div class="stat-item">
              <span class="stat-label">Total de URLs:</span>
              <span class="stat-value"><xsl:value-of select="count(sitemap:urlset/sitemap:url)"/></span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Sitemap XSL Status:</span>
              <span class="stat-value">Estilizado e Ativo</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50%;">URL (Localização)</th>
                <th style="width: 15%;">Prioridade</th>
                <th style="width: 15%;">Frequência</th>
                <th style="width: 20%;">Última Modificação</th>
              </tr>
            </thead>
            <tbody>
              <xsl:for-each select="sitemap:urlset/sitemap:url">
                <tr>
                  <td>
                    <a href="{sitemap:loc}" target="_blank">
                      <xsl:value-of select="sitemap:loc"/>
                    </a>
                  </td>
                  <td>
                    <span class="badge">
                      <xsl:value-of select="sitemap:priority"/>
                    </span>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:changefreq"/>
                  </td>
                  <td>
                    <xsl:value-of select="sitemap:lastmod"/>
                  </td>
                </tr>
              </xsl:for-each>
            </tbody>
          </table>

          <div class="footer">
            Paflegis - Facilitador de Consulta Pública e Acesso às Informações Legislativas de Pedro Afonso - TO
          </div>
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
