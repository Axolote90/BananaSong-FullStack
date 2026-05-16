/**
 * CONFIGURACIÓN DE API PARA BANANA SONG
 * 
 * MODO LOCAL: Usa 'http://localhost:3000'
 * MODO REMOTO (ngrok): Usa la URL proporcionada por ngrok
 */

// MODO REMOTO (ngrok): Reemplaza la URL de abajo con la nueva de ngrok cada vez que inicies el túnel
export const API_BASE_URL = 'https://30fe-2806-2f0-7580-f185-ae4e-65ff-fea3-5490.ngrok-free.app'; 

// MODO LOCAL (descomenta para volver a local y comenta la de arriba)
// export const API_BASE_URL = 'http://localhost:3000'; 

export const API_CONFIG = {
  auth: `${API_BASE_URL}/api/auth`,
  users: `${API_BASE_URL}/api/users`,
  levels: `${API_BASE_URL}/api/levels`,
  progress: `${API_BASE_URL}/api/progress`,
  status: `${API_BASE_URL}/api/status`
};
