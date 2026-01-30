/**
 * Genera data/<slug>.json con ~2.700+ palabras por categoría (base + diccionario)
 * para alcanzar ~50.000 palabras totales. Ejecutar: node seeds/generate-data.js
 */

const fs = require('fs');
const path = require('path');
const { wordPacks } = require('./wordPacks');
const { getBulkWordsDistributed } = require('./bulkWordsLoader');

const SEEDS_DIR = path.join(__dirname);
const DATA_DIR = path.join(SEEDS_DIR, 'data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function run() {
  ensureDir(DATA_DIR);
  const packsWithWords = wordPacks.filter((p) => p.slug !== 'personalizado');
  const bulk = getBulkWordsDistributed();

  if (bulk.length === 0 || bulk.every((arr) => arr.length === 0)) {
    console.warn('⚠️ No hay palabras del diccionario. Instala: npm install an-array-of-spanish-words');
    console.log('Escribiendo solo palabras base por categoría...');
  }

  let totalWords = 0;
  for (let i = 0; i < packsWithWords.length; i++) {
    const pack = packsWithWords[i];
    const base = pack.words || [];
    const extra = bulk[i] || [];
    const combined = [...new Set([...base, ...extra])];
    const filePath = path.join(DATA_DIR, `${pack.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(combined), 'utf8');
    totalWords += combined.length;
    console.log(`  ${pack.slug}: ${combined.length} palabras`);
  }

  console.log(`\n✅ Generados ${packsWithWords.length} archivos en seeds/data/`);
  console.log(`📊 Total palabras: ${totalWords}`);
}

run();
