/**
 * Formatea la palabra para mostrarla en la app: primera letra mayúscula.
 * @param {string} word - Palabra o frase a formatear
 * @returns {string} - Palabra con la primera letra en mayúscula
 */
export function capitalizeWord(word) {
  if (word == null || typeof word !== 'string') return '';
  const trimmed = word.trim();
  if (trimmed.length === 0) return '';
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
