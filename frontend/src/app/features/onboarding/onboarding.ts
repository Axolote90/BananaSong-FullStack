import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';

interface Instrument {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './onboarding.html',
  styleUrl: './onboarding.css'
})
export class OnboardingComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  currentStep = signal(1);
  isLoading = signal(false);
  errorMessage = signal('');
  
  // Datos de registro
  username = '';
  email = '';
  password = '';
  
  instruments: Instrument[] = [
    { id: 'ukulele', name: 'Ukelele', icon: '🎸', description: 'El pequeño gigante' },
    { id: 'guitar_acoustic', name: 'Guitarra Acústica', icon: '🎵', description: 'Sonido cálido y natural' },
    { id: 'guitar_electric', name: 'Guitarra Eléctrica', icon: '⚡', description: 'Poder y versatilidad' },
    { id: 'piano', name: 'Piano', icon: '🎹', description: 'Armonía y melodía' },
    { id: 'flute', name: 'Flauta Dulce', icon: '💨', description: 'Viento y melodía clásica' },
    { id: 'violin', name: 'Violín', icon: '🎻', description: 'Elegancia clásica' }
  ];

  selectedTarget = signal<string | null>(null);
  knownInstruments = signal<string[]>([]);
  skillLevel = signal<string | null>(null);

  register() {
    this.errorMessage.set(''); // Limpiar errores previos
    
    if (!this.username || !this.email || !this.password) {
      this.errorMessage.set('Por favor completa todos los campos');
      return;
    }

    if (this.username.length < 3) {
      this.errorMessage.set('El usuario debe tener al menos 3 caracteres');
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage.set('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    this.isLoading.set(true);
    this.authService.register({ username: this.username, email: this.email, password: this.password })
      .subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          this.currentStep.set(2); // Ir a confirmación de correo
        },
        error: (err) => {
          this.isLoading.set(false);
          console.error('Error en registro:', err);
          
          // Si el backend envía errores de validación específicos (express-validator)
          if (err.error?.errors && Array.isArray(err.error.errors)) {
            this.errorMessage.set(err.error.errors[0].msg);
          } else {
            this.errorMessage.set(err.error?.message || 'Error al conectar con el servidor');
          }
        }
      });
  }

  confirmarSimulada() {
    // En un flujo real, el usuario haría clic en el link del correo.
    // Aquí simulamos que ya confirmó y pasamos al paso 3.
    this.currentStep.set(3);
  }

  selectTarget(id: string) {
    this.selectedTarget.set(id);
    this.currentStep.set(4);
  }

  toggleKnown(id: string) {
    const current = this.knownInstruments();
    if (current.includes(id)) {
      this.knownInstruments.set(current.filter(i => i !== id));
    } else {
      this.knownInstruments.set([...current, id]);
    }
  }

  selectLevel(level: string) {
    this.skillLevel.set(level);
    this.finishOnboarding();
  }

  finishOnboarding() {
    const data = {
      targetInstrument: this.selectedTarget(),
      knownInstruments: this.knownInstruments(),
      skillLevel: this.skillLevel()
    };

    this.isLoading.set(true);
    this.authService.updateOnboarding(data).subscribe({
      next: () => this.router.navigate(['/tutorial']),
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error saving onboarding:', err);
      }
    });
  }
}
