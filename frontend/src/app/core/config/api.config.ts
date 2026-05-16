/**
 * CONFIGURACIÓN DE API PARA BANANA SONG
 * 
 * MODO LOCAL: Usa 'http://localhost:3000'
 * MODO REMOTO (ngrok): Usa la URL proporcionada por ngrok
 */

// CAMBIA ESTA URL CUANDO INICIES NGROK
// Ejemplo: export const API_BASE_URL = 'https://abc-123.ngrok-free.app';
export const API_BASE_URL = 'http://localhost:3000'; 

export const API_CONFIG = {
  auth: `${API_BASE_URL}/api/auth`,
  users: `${API_BASE_URL}/api/users`,
  levels: `${API_BASE_URL}/api/levels`,
  progress: `${API_BASE_URL}/api/progress`,
  status: `${API_BASE_URL}/api/status`
};
