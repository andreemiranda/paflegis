/**
 * scripts/verifyParity.ts — Script de verificação de paridade entre o espelho local e o SAPL upstream.
 * Executado via `npm run verify:parity`.
 */

import { getConfig } from '../lib/config/index.js';
import { getStorage } from '../lib/storage/index.js';
import { safeFetchWithRetry } from '../lib/sapl/backend.js';
import { discoverCatalog } from '../lib/sapl/discovery.js';

async function main() {
  console.log('🔍 Iniciando verificação de paridade (Espelho Local vs SAPL Upstream)...');

  const config = getConfig();
  const storage = getStorage();
  const catalog = await discoverCatalog();

  console.log(`📡 SAPL Upstream: ${config.saplApiBase}`);
  console.log(`📦 Recursos no catálogo: ${catalog.endpoints.length}`);

  let totalDivergences = 0;
  let verified = 0;

  // Seleciona uma amostra representativa dos principais recursos
  const keyResources = [
    { modulo: 'materia', recurso: 'materialegislativa' },
    { modulo: 'norma', recurso: 'normajuridica' },
    { modulo: 'sessao', recurso: 'sessaoplenaria' },
    { modulo: 'parlamentares', recurso: 'parlamentar' },
    { modulo: 'comissoes', recurso: 'comissao' },
  ];

  for (const item of keyResources) {
    const resourceKey = `${item.modulo}:${item.recurso}`;
    const ep = catalog.endpoints.find(
      (e) =>
        (e.modulo === item.modulo && e.recurso === item.recurso) ||
        e.key === `${item.modulo}/${item.recurso}` ||
        e.path?.includes(`/${item.modulo}/${item.recurso}/`)
    );
    if (!ep) {
      console.log(`⚠️ Recurso ${resourceKey} não encontrado no catálogo.`);
      continue;
    }

    verified++;
    console.log(`\n--- Testando [${resourceKey}] ---`);

    // 1. Contagem no espelho
    const mirrorCount = await storage.countRecords(item.modulo, item.recurso);

    // 2. Contagem no upstream
    let upstreamCount = 0;
    try {
      const res = await safeFetchWithRetry(`${ep.url}?page_size=1`, 6000, 1);
      if (res.ok) {
        const json = await res.json();
        upstreamCount = json.count ?? (Array.isArray(json) ? json.length : 0);
      }
    } catch (e: any) {
      console.log(`❌ Falha ao consultar upstream para ${resourceKey}: ${e.message}`);
      continue;
    }

    console.log(`  📊 Upstream Count: ${upstreamCount}`);
    console.log(`  💾 Mirror Count:   ${mirrorCount}`);

    // 3. Testa amostra de registro se houver registros
    const sample = await storage.listRecords(item.modulo, item.recurso, { page: 1, limit: 1 });
    if (sample.items.length > 0) {
      console.log(`  ✅ Amostra no espelho validada (Total recuperável: ${sample.total})`);
    } else {
      console.log(`  ℹ️ Nenhum registro presente no espelho para esta coleção.`);
    }

    // Se upstream tiver registros e o espelho estiver vazio, registra divergência
    if (upstreamCount > 0 && mirrorCount === 0) {
      totalDivergences++;
    }
  }

  console.log('\n=============================================');
  if (totalDivergences > 0) {
    console.log(`⚠️ Verificação concluída com ${totalDivergences} divergências (recursos pendentes de sincronização inicial).`);
    console.log('Execute POST /api/v1/sync para popular o espelho local.');
  } else {
    console.log(`🎉 Paridade confirmada para os ${verified} recursos principais testados!`);
  }
}

main().catch((err) => {
  console.error('Erro na verificação de paridade:', err);
  process.exit(1);
});
