import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LevelService } from '../../core/services/level';
import { Level } from '../../core/models/level';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faEye, faGear, faUser, faFire, faHeart, faMusic } from '@fortawesome/free-solid-svg-icons'; 
import { AuthService } from '../../core/services/auth';


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

  // --- TUTORIAL ESTADO ---
  isTutorialMode = signal(false);
  tutorialStep = signal(1);
  tutorialDialog = signal<string | null>(null);

  // --- INSTRUMENTO SELECCIONADO ---
  selectedInstrument = signal<string>('ukulele');
  
  availableInstruments = [
    { id: 'ukulele', name: 'Ukelele', icon: '🎸' },
    { id: 'guitar_acoustic', name: 'Acústica', icon: '🎵' },
    { id: 'guitar_electric', name: 'Eléctrica', icon: '⚡' },
    { id: 'violin', name: 'Violín', icon: '🎻' }
  ];

  // --- CICLO DE VIDA ---
  private route = inject(ActivatedRoute);

  ngOnInit() {
    // Inicializar con el instrumento del usuario
    const userInstrument = this.user()?.targetInstrument || 'ukulele';
    this.selectedInstrument.set(userInstrument);
    
    this.cargarCanciones();
    const isTutorial = this.route.snapshot.queryParamMap.get('tutorial') === 'true';
    if (isTutorial) {
      this.iniciarTutorialMenu();
    }

    // Refrescar perfil desde el servidor para sincronizar XP/vidas/racha
    this.authService.getProfile().subscribe();
  }

  iniciarTutorialMenu() {
    this.isTutorialMode.set(true);
    this.runTutorialStep(1);
  }

  runTutorialStep(step: number) {
    this.tutorialStep.set(step);
    switch (step) {
      case 1:
        this.tutorialDialog.set("¡Bienvenido al Menú Principal! Aquí encontrarás todas las canciones disponibles.");
        break;
      case 2:
        this.tutorialDialog.set("Cada tarjeta representa una canción. Puedes ver su dificultad por los colores (verde, amarillo, rojo).");
        break;
      case 3:
        this.tutorialDialog.set("Tienes el botón '¡Jugar!' para practicar tocando tu instrumento real con el micrófono.");
        break;
      case 4:
        this.tutorialDialog.set("También tienes el botón de 'Ojo' para el modo Práctica Auto-Play, donde el juego toca solo para que escuches y aprendas.");
        break;
      case 5:
        this.tutorialDialog.set("Arriba tienes acceso rápido al Afinador y a tu Perfil. ¡Explora y diviértete!");
        break;
      case 6:
        this.tutorialDialog.set(null);
        this.isTutorialMode.set(false);
        // Remove query param to prevent repeating tutorial on refresh
        this.router.navigate([], { relativeTo: this.route, queryParams: { tutorial: null }, queryParamsHandling: 'merge' });
        break;
    }
  }

  nextTutorialStep() {
    this.runTutorialStep(this.tutorialStep() + 1);
  }

  // --- FUNCIONES PRINCIPALES ---
  cargarCanciones() {
    this.isLoading.set(true);
    this.levelService.getLevels(this.selectedInstrument()).subscribe({
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

  cambiarInstrumento(id: string) {
    if (this.selectedInstrument() === id) return;
    
    this.selectedInstrument.set(id);
    this.cargarCanciones();
    
    // Opcional: Persistir en el backend
    this.authService.updateOnboarding({ targetInstrument: id }).subscribe();
  }

  getInstrumentXP(): number {
    const stats = this.user()?.instrumentStats;
    const instr = this.selectedInstrument();
    return stats && stats[instr] ? stats[instr].xp : 0;
  }

  getInstrumentLevel(): number {
    const stats = this.user()?.instrumentStats;
    const instr = this.selectedInstrument();
    return stats && stats[instr] ? stats[instr].level : 1;
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