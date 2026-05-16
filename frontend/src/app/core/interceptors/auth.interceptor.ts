import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const user = authService.currentUser();
  
  // Añadimos el header para saltar el aviso de ngrok en todas las peticiones
  let headers: any = {
    'ngrok-skip-browser-warning': '69420'
  };

  if (user && user.token) {
    headers['Authorization'] = `Bearer ${user.token}`;
  }

  req = req.clone({ setHeaders: headers });
  
  return next(req);
};
