/**
 * Carga ~48.600 palabras del diccionario español y las reparte
 * en 18 categorías (~2.700 por categoría) para alcanzar ~50.000 palabras totales
 * junto con las palabras curadas en wordPacks.
 */

const TARGET_TOTAL = 50000;
const CATEGORIES_WITH_BULK = 18; // Todas excepto "personalizado"
const MIN_LENGTH = 4;
const MAX_LENGTH = 16;

function shuffle (array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function capitalizeSpanish (word) {
  if (!word || typeof word !== 'string') return word;
  const trimmed = word.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/**
 * Carga palabras del paquete an-array-of-spanish-words, filtra por longitud,
 * mezcla y reparte en CATEGORIES_WITH_BULK arrays.
 * @returns {string[][]} Array de 18 arrays de palabras (capitalizadas)
 */
function getBulkWordsDistributed () {
  let allWords;
  try {
    allWords = require('an-array-of-spanish-words');
  } catch (e) {
    console.warn('⚠️ an-array-of-spanish-words no instalado; usando 0 palabras extra.');
    return Array(CATEGORIES_WITH_BULK)
      .fill(null)
      .map(() => []);
  }

  if (!Array.isArray(allWords) || allWords.length === 0) {
    return Array(CATEGORIES_WITH_BULK)
      .fill(null)
      .map(() => []);
  }

  const filtered = allWords.filter(
    (w) =>
      typeof w === 'string' &&
      w.length >= MIN_LENGTH &&
      w.length <= MAX_LENGTH &&
      /^[a-záéíóúñü\s\-]+$/i.test(w) &&
      !/\d/.test(w)
  );

  const unique = [...new Set(filtered)];
  const shuffled = shuffle(unique);

  const totalBulk = Math.min(TARGET_TOTAL - 1500, shuffled.length);
  const perCategory = Math.floor(totalBulk / CATEGORIES_WITH_BULK);
  const takeTotal = Math.min(perCategory * CATEGORIES_WITH_BULK, shuffled.length);
  const selected = shuffled.slice(0, takeTotal);

  const chunks = [];
  for (let i = 0; i < CATEGORIES_WITH_BULK; i++) {
    const start = i * perCategory;
    const end = i === CATEGORIES_WITH_BULK - 1 ? selected.length : start + perCategory;
    chunks.push(
      selected.slice(start, end).map(capitalizeSpanish)
    );
  }

  return chunks;
}

module.exports = { getBulkWordsDistributed, CATEGORIES_WITH_BULK };
