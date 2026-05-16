import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { HttpErrorResponse } from '@angular/common/http'; // <-- 1. Importamos el tipo de error de Angular
import { Router } from '@angular/router';

// ⚠️ ATENCIÓN AQUÍ: Si VS Code sigue marcando estas dos líneas en rojo, 
// borra la ruta entre comillas, escribe './' y deja que VS Code te autocomplete la ruta correcta.
import { AuthService } from '../../core/services/auth';
import { AuthResponse } from '../../core/models/user'; 

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth.html',
  styleUrl: './auth.css'
})
export class AuthComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = '';
  password = '';

  isLoading = signal(false);
  message = signal('');
  isError = signal(false);

  login() {
    if (!this.validarCampos()) return;
    this.prepararPeticion('Iniciando sesión...');

// Dentro de login()
this.authService.login({ username: this.username, password: this.password })
  .subscribe({
    next: (res: AuthResponse) => {
      // Ya no necesitas manejar la lógica de guardado aquí, 
      // el AuthService ya lo hizo en el .pipe(tap(...))
      this.manejarExito(res.message);
      this.router.navigate(['/menu']); 
    },
    error: (err: HttpErrorResponse) => this.manejarError(err.error?.message || 'Error al iniciar sesión')
  });
  }

  register() {
    if (!this.validarCampos()) return;

    this.prepararPeticion('Creando cuenta...');

    this.authService.register({ username: this.username, password: this.password })
      .subscribe({
        // 3. Tipado estricto también aquí
        next: (res: AuthResponse) => this.manejarExito(res.message),
        error: (err: HttpErrorResponse) => this.manejarError(err.error?.message || 'Error al crear cuenta')
      });
  }

  private validarCampos(): boolean {
    if (!this.username.trim() || !this.password.trim()) {
      this.manejarError('Por favor, llena ambos campos');
      return false;
    }
    return true;
  }

  private prepararPeticion(texto: string) {
    this.isLoading.set(true);
    this.message.set(texto);
    this.isError.set(false);
  }

  private manejarExito(texto: string, data?: any) {
    this.message.set(texto);
    this.isError.set(false);
    this.isLoading.set(false);
    if (data) console.log('Datos guardados:', data);
  }

  private manejarError(texto: string) {
    this.message.set(texto);
    this.isError.set(true);
    this.isLoading.set(false);
  }
}