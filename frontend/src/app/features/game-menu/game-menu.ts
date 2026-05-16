import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LevelService } from '../../core/services/level';
import { Level } from '../../core/models/level';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faEye, faGear, faUser, faFire, faHeart, faMusic } from '@fortawesome/free-solid-svg-icons'; 
import { AuthService } from '../../core/services/auth';

import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-game-menu',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, RouterModule],
  templateUrl: './game-menu.html', 
  styleUrl: './game-menu.css',
})
export class GameMenuComponent implements OnInit {
  // --- INYECCIONES ---
  authService = inject(AuthService);
  private router = inject(Router);
  private levelService = inject(LevelService);
  
  // Acceso a la señal del usuario
  user = this.authService.currentUser;

  // --- ICONOS ---
  faPlay = faPlay;
  faEye = faEye;
  faUser = faUser;
  faFire = faFire;
  faHeart = faHeart;
  faMusic = faMusic;

  // --- ESTADO (Signals) ---
  levels = signal<Level[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');

  // --- CICLO DE VIDA ---
  ngOnInit() {
    this.cargarCanciones();
  }

  // --- FUNCIONES PRINCIPALES ---
  cargarCanciones() {
    this.levelService.getLevels().subscribe({
      next: (data: Level[]) => {
        this.levels.set(data);       
        this.isLoading.set(false);   
      },
      error: (err) => {
        console.error('Error al cargar las canciones:', err);
        this.errorMessage.set('No pudimos conectar con el servidor para cargar las canciones.');
        this.isLoading.set(false);
      }
    });
  }

  seleccionarNivel(id: number, mode: 'play' | 'auto') {
    this.router.navigate(['/game', id], { queryParams: { mode: mode } }); 
  }

  abrirAfinador() {
    this.router.navigate(['/tuner']); 
  }

  irAlPerfil() {
    this.router.navigate(['/profile']);
  }

  verificarHuevoDePascua() {
    if (this.user()?.xp > 1000) {
      console.log("¡Ukelele de Oro desbloqueado! 🎸✨");
    }
  }

  getSafeProfileUrl(url: any): string {
    if (!url || typeof url !== 'string' || url.startsWith('blob:')) {
      return 'assets/img/banana.jpg';
    }
    return url;
  }
}