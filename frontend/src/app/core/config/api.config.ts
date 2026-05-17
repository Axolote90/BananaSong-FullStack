/**
 * CONFIGURACIÓN DE API PARA BANANA SONG
 * 
 * MODO LOCAL: Usa 'http://localhost:3000'
 * MODO REMOTO (ngrok): Usa la URL proporcionada por ngrok
 */

// MODO REMOTO/LOCAL AUTOMÁTICO: Si estamos en el puerto 4200 (desarrollo local de Angular), apunta al backend en localhost:3000.
// Si está en producción o expuesto por ngrok, usa dinámicamente el mismo host (window.location.origin).
export const API_BASE_URL = typeof window !== 'undefined' 
  ? (window.location.port === '4200' ? 'http://localhost:3000' : window.location.origin)
  : ''; 

export const API_CONFIG = {
  auth: `${API_BASE_URL}/api/auth`,
  users: `${API_BASE_URL}/api/users`,
  levels: `${API_BASE_URL}/api/levels`,
  progress: `${API_BASE_URL}/api/progress`,
  status: `${API_BASE_URL}/api/status`
};
