const STORAGE_KEY = 'imposter_stats_id';

/**
 * Genera un UUID v4 simple para identificar al jugador en estadísticas
 * @returns {string}
 */
function generateId () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Obtiene el ID de estadísticas del jugador desde localStorage o crea uno nuevo
 * @returns {string}
 */
export function getOrCreateStatsId () {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id || typeof id !== 'string' || id.length < 10) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return generateId();
  }
}
