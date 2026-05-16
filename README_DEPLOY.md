# Guía de Despliegue: Banana Song (GitHub + ngrok)

He preparado el proyecto para su despliegue temporal. Debido a que `gh` y `ngrok` no están instalados en este entorno, deberás realizar los pasos finales manualmente.

## 1. Copia en GitHub (Backup)
1. Crea un nuevo repositorio en GitHub llamado `BananaSong-FullStack`.
2. Sigue estas instrucciones en tu terminal para subir el código:
   ```bash
   cd c:\Users\luism\ProgramingProyects\BananaSong\banana-song
   git remote add origin https://github.com/TU_USUARIO/BananaSong-FullStack.git
   git push -u origin main
   ```

## 2. Despliegue con ngrok (Temporal)
He creado una rama llamada `deploy-ngrok` con la configuración lista. Para usarla:

### Paso A: Exponer el Backend
1. Descarga e instala [ngrok](https://ngrok.com/download).
2. Asegúrate de que el backend esté corriendo (`node .\src\app.js` en la carpeta backend).
3. En una nueva terminal, ejecuta:
   ```bash
   ngrok http 3000
   ```
4. Copia la URL que te da ngrok (ejemplo: `https://abc-123.ngrok-free.app`).

### Paso B: Configurar el Frontend
1. Cambia a la rama de despliegue: `git checkout deploy-ngrok`.
2. Abre el archivo `frontend/src/app/core/config/api.config.ts`.
3. Reemplaza `localhost:3000` con la URL de ngrok que copiaste.
   ```typescript
   export const API_BASE_URL = 'https://tu-url-de-ngrok.ngrok-free.app';
   ```
4. Re-compila el frontend:
   ```bash
   cd frontend
   npm run build
   ```

### Paso C: Exponer el Frontend
1. Puedes usar una herramienta como `serve` o simplemente exponer el puerto de desarrollo:
   ```bash
   # Opción 1: Exponer puerto de desarrollo
   ngrok http 4200
   
   # Opción 2: Servir la carpeta dist (recomendado para producción)
   npx serve -s dist/frontend -l 8080
   ngrok http 8080
   ```

## 3. Cómo volver al modo local
Si quieres volver a trabajar localmente:
1. Cambia a la rama principal: `git checkout main`.
2. O simplemente edita `api.config.ts` y vuelve a poner `http://localhost:3000`.

---
**Nota sobre la Base de Datos**: No necesitas exponer la base de datos (MySQL) individualmente. El backend se conecta a ella localmente y ngrok solo expone el backend al mundo.
