/**
 * CONFIGURACIÓN DE API PARA BANANA SONG
 * 
 * MODO LOCAL: Usa 'http://localhost:3000'
 * MODO REMOTO (ngrok): Usa la URL proporcionada por ngrok
 */

// MODO REMOTO/LOCAL AUTOMÁTICO: Resuelve dinámicamente el host (sea ngrok o localhost)
export const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : ''; 

export const API_CONFIG = {
  auth: `${API_BASE_URL}/api/auth`,
  users: `${API_BASE_URL}/api/users`,
  levels: `${API_BASE_URL}/api/levels`,
  progress: `${API_BASE_URL}/api/progress`,
  status: `${API_BASE_URL}/api/status`
};
