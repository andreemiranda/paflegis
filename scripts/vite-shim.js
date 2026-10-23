#!/usr/bin/env node
/**
 * scripts/vite-shim.js — Compatibilidade e resiliência de build.
 *
 * Se a plataforma de deploy ou ambiente CI estiver erroneamente configurado
 * para executar "vite build", este shim intercepta o comando e delega
 * transparentemente para o bundler real do projeto (Next.js: "next build").
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);

// Mapeia comandos e argumentos para o Next.js
let nextArgs = [];

if (args.includes('--version') || args.includes('-v')) {
  console.log('paflegis-next-builder/1.0.0 (Next.js compatibility shim for Vite)');
  process.exit(0);
}

if (args[0] === 'dev') {
  nextArgs = ['dev', '-H', '0.0.0.0', '-p', '3000'];
} else if (args[0] === 'preview' || args[0] === 'start') {
  nextArgs = ['start', '-H', '0.0.0.0', '-p', '3000'];
} else {
  // Padrão para "build" ou qualquer outro parâmetro
  nextArgs = ['build'];
}

console.log(`[paflegis-build] Projeto Next.js detectado. Executando: next ${nextArgs.join(' ')}`);

const isWindows = process.platform === 'win32';
const nextCmd = isWindows ? 'next.cmd' : 'next';
const nextBinPath = path.resolve(__dirname, '../node_modules/.bin', nextCmd);

const env = { ...process.env };
if (nextArgs[0] === 'build') {
  env.NODE_ENV = 'production';
}

const child = spawn(nextBinPath, nextArgs, {
  stdio: 'inherit',
  shell: true,
  env,
});

child.on('error', (err) => {
  // Se não encontrar o binário em node_modules/.bin, tenta npx next
  console.warn(`[paflegis-build] Tentando fallback para npx next... (${err.message})`);
  const fallback = spawn('npx', ['next', ...nextArgs], {
    stdio: 'inherit',
    shell: true,
    env: process.env,
  });
  fallback.on('exit', (code) => process.exit(code ?? 0));
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
