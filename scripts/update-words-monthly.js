/**
 * Script para ejecutar el día 1 de cada mes (cron):
 * 1. Busca actualizaciones de palabras en es-ES y pt-PT (URLs configurables).
 * 2. Si hay actualizaciones, las descarga y guarda en backend/seeds/data/updates-*.json.
 * 3. Ejecuta el seed para subir todo a la base de datos.
 * 4. Hace commit y push con las actualizaciones.
 *
 * Variables de entorno (opcionales):
 *   WORDS_ES_ES_UPDATE_URL  - URL que devuelve JSON: { "slug": ["palabra1", ...], ... }
 *   WORDS_PT_PT_UPDATE_URL - Idem para pt-PT
 *   MONGODB_URI            - URI de MongoDB (para el seed)
 *
 * Uso desde la raíz del repo: node scripts/update-words-monthly.js
 * Cron ejemplo (día 1 a las 00:00): 0 0 1 * * cd /path/to/repo && node scripts/update-words-monthly.js
 */

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const BACKEND_ROOT = path.join(REPO_ROOT, 'backend');
const DATA_DIR = path.join(BACKEND_ROOT, 'seeds', 'data');
const UPDATES_ES = path.join(DATA_DIR, 'updates-es.json');
const UPDATES_PT = path.join(DATA_DIR, 'updates-pt.json');

// Cargar .env del backend
require('dotenv').config({ path: path.join(BACKEND_ROOT, '.env') });

function loadJson (filePath, defaultValue = {}) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    console.warn('⚠️  No se pudo leer', filePath, e.message);
  }
  return typeof defaultValue === 'object' ? { ...defaultValue } : defaultValue;
}

function saveJson (filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function mergeWordsBySlug (current, fetched) {
  const result = { ...current };
  if (!fetched || typeof fetched !== 'object') return result;
  for (const [slug, words] of Object.entries(fetched)) {
    if (!slug || !Array.isArray(words)) continue;
    const existing = new Set((result[slug] || []).map((w) => String(w).toLowerCase().trim()));
    const added = words
      .filter((w) => {
        const s = String(w).trim();
        return s && !existing.has(s.toLowerCase()) && (existing.add(s.toLowerCase()), true);
      });
    result[slug] = [...(result[slug] || []), ...added];
  }
  return result;
}

async function fetchUrl (url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchUpdates () {
  let changed = false;
  const esUrl = process.env.WORDS_ES_ES_UPDATE_URL;
  const ptUrl = process.env.WORDS_PT_PT_UPDATE_URL;

  if (esUrl) {
    try {
      console.log('📥 Buscando actualizaciones es-ES...');
      const fetched = await fetchUrl(esUrl);
      const current = loadJson(UPDATES_ES, {});
      const merged = mergeWordsBySlug(current, fetched);
      const hasNew = JSON.stringify(merged) !== JSON.stringify(current);
      if (hasNew) {
        saveJson(UPDATES_ES, merged);
        changed = true;
        console.log('✅ Actualizaciones es-ES guardadas en', UPDATES_ES);
      } else {
        console.log('⏭️  Sin cambios en es-ES');
      }
    } catch (e) {
      console.error('❌ Error al obtener es-ES:', e.message);
    }
  } else {
    console.log('⏭️  WORDS_ES_ES_UPDATE_URL no configurada, omitiendo es-ES');
  }

  if (ptUrl) {
    try {
      console.log('📥 Buscando actualizaciones pt-PT...');
      const fetched = await fetchUrl(ptUrl);
      const current = loadJson(UPDATES_PT, {});
      const merged = mergeWordsBySlug(current, fetched);
      const hasNew = JSON.stringify(merged) !== JSON.stringify(current);
      if (hasNew) {
        saveJson(UPDATES_PT, merged);
        changed = true;
        console.log('✅ Actualizaciones pt-PT guardadas en', UPDATES_PT);
      } else {
        console.log('⏭️  Sin cambios en pt-PT');
      }
    } catch (e) {
      console.error('❌ Error al obtener pt-PT:', e.message);
    }
  } else {
    console.log('⏭️  WORDS_PT_PT_UPDATE_URL no configurada, omitiendo pt-PT');
  }

  return changed;
}

function runSeed () {
  console.log('🌱 Ejecutando seed en la base de datos...');
  const r = spawnSync('node', ['scripts/seed-standalone.js'], {
    cwd: BACKEND_ROOT,
    stdio: 'inherit',
    env: { ...process.env, MONGODB_URI: process.env.MONGODB_URI },
  });
  if (r.status !== 0) {
    throw new Error('El seed falló con código ' + r.status);
  }
}

function gitCommitAndPush () {
  const toAdd = [UPDATES_ES, UPDATES_PT].filter((p) => fs.existsSync(p));
  if (toAdd.length === 0) return;

  const add = spawnSync('git', ['add', path.relative(REPO_ROOT, UPDATES_ES), path.relative(REPO_ROOT, UPDATES_PT)], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (add.status !== 0) throw new Error('git add falló');

  const status = spawnSync('git', ['status', '--short'], { cwd: REPO_ROOT, encoding: 'utf8' });
  if (!status.stdout.trim()) {
    console.log('⏭️  No hay cambios que commitear');
    return;
  }

  const commit = spawnSync('git', ['commit', '-m', 'chore: actualización mensual de palabras (es-ES, pt-PT)'], {
    cwd: REPO_ROOT,
    stdio: 'inherit',
  });
  if (commit.status !== 0) throw new Error('git commit falló');

  // En Render (u otro CI) usar GITHUB_TOKEN para push: configurar remote con token
  if (process.env.GITHUB_TOKEN) {
    const urlOut = spawnSync('git', ['config', '--get', 'remote.origin.url'], { cwd: REPO_ROOT, encoding: 'utf8' });
    const remoteUrl = (urlOut.stdout || '').trim();
    if (remoteUrl && remoteUrl.startsWith('https://')) {
      const withToken = remoteUrl.replace(/^https:\/\//, `https://${process.env.GITHUB_TOKEN}@`);
      spawnSync('git', ['remote', 'set-url', 'origin', withToken], { cwd: REPO_ROOT, stdio: 'pipe' });
    }
  }

  const push = spawnSync('git', ['push'], { cwd: REPO_ROOT, stdio: 'inherit' });
  if (push.status !== 0) throw new Error('git push falló');
  console.log('✅ Commit y push realizados');
}

async function main () {
  console.log('📅 Ejecutando actualización mensual de palabras...\n');

  const updatesChanged = await fetchUpdates();

  // Siempre ejecutar seed para dejar la DB en sync con el código y los updates actuales
  runSeed();

  if (updatesChanged) {
    gitCommitAndPush();
  } else {
    console.log('⏭️  No hubo actualizaciones descargadas; no se hace commit.');
  }

  console.log('\n✅ Actualización mensual terminada.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
