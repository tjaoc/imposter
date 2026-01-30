/**
 * URL base del backend para peticiones API.
 * En desarrollo: vacío usa el proxy de Vite (/api → backend).
 * En producción: definir VITE_API_URL (ej. https://api.tudominio.com).
 */
export const API_BASE = import.meta.env.VITE_API_URL || '';
