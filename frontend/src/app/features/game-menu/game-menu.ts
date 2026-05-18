import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LevelService } from '../../core/services/level';
import { Level } from '../../core/models/level';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPlay, faEye, faGear, faUser, faFire, faHeart, faMusic, faPlus, faBook } from '@fortawesome/free-solid-svg-icons'; 
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
  faPlus = faPlus;
  faBook = faBook;

  // --- ESTADO (Signals) ---
  levels = signal<Level[]>([]);
  isLoading = signal(true);
  errorMessage = signal('');
  showAddInstrumentMenu = signal(false);
  showNotesGuide = signal(false);
  activeGuideNoteIndex = signal<number>(0);

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
    { id: 'violin', name: 'Violín', icon: '🎻' },
    { id: 'flute', name: 'Flauta Dulce', icon: '💨' },
    { id: 'piano', name: 'Piano', icon: '🎹' }
  ];

  // --- GUÍA DE NOTAS Y ACORDES ---
  guideData: { [key: string]: Array<{ name: string, subtitle?: string, fingers?: number[], pianoKeys?: number[], fretPositions?: Array<{ string: number, fret: number, finger?: string }> }> } = {
    "flute": [
      { name: "Do (C4)", subtitle: "Todos los agujeros cerrados", fingers: [1, 1, 1, 1, 1, 1, 1, 1] },
      { name: "Re (D4)", subtitle: "Quitar el meñique derecho", fingers: [1, 1, 1, 1, 1, 1, 1, 0] },
      { name: "Mi (E4)", subtitle: "Quitar los dos dedos de la mano derecha", fingers: [1, 1, 1, 1, 1, 1, 0, 0] },
      { name: "Fa (F4)", subtitle: "Agujero 5 abierto (estilo alemán)", fingers: [1, 1, 1, 1, 1, 0, 0, 0] },
      { name: "Sol (G4)", subtitle: "Mano izquierda cerrada", fingers: [1, 1, 1, 1, 0, 0, 0, 0] },
      { name: "La (A4)", subtitle: "Dos dedos mano izquierda", fingers: [1, 1, 1, 0, 0, 0, 0, 0] },
      { name: "Si (B4)", subtitle: "Un solo dedo mano izquierda", fingers: [1, 1, 0, 0, 0, 0, 0, 0] },
      { name: "Do (C5)", subtitle: "Agujero 2 cerrado (dedo medio)", fingers: [1, 0, 1, 0, 0, 0, 0, 0] },
      { name: "Re (D5)", subtitle: "Agujero 2 cerrado, pulgar libre", fingers: [0, 0, 1, 0, 0, 0, 0, 0] },
      { name: "Mi (E5)", subtitle: "Pulgar a la mitad", fingers: [0.5, 1, 1, 1, 1, 1, 0, 0] },
      { name: "Fa (F5)", subtitle: "Pulgar a la mitad", fingers: [0.5, 1, 1, 1, 1, 0, 0, 0] },
      { name: "Sol (G5)", subtitle: "Pulgar a la mitad", fingers: [0.5, 1, 1, 1, 0, 0, 0, 0] }
    ],
    "ukulele": [
      { name: "Do Mayor (C)", subtitle: "El acorde de inicio perfecto", fretPositions: [{ string: 1, fret: 3, finger: "3" }] },
      { name: "Sol Mayor (G)", subtitle: "Clásico y alegre", fretPositions: [{ string: 1, fret: 2, finger: "2" }, { string: 2, fret: 3, finger: "3" }, { string: 3, fret: 2, finger: "1" }] },
      { name: "La Menor (Am)", subtitle: "Melancólico e intenso", fretPositions: [{ string: 4, fret: 2, finger: "2" }] },
      { name: "Fa Mayor (F)", subtitle: "Cálido y dulce", fretPositions: [{ string: 4, fret: 2, finger: "2" }, { string: 2, fret: 1, finger: "1" }] },
      { name: "Re Mayor (D)", subtitle: "Brillante y sonoro", fretPositions: [{ string: 4, fret: 2, finger: "1" }, { string: 3, fret: 2, finger: "2" }, { string: 2, fret: 2, finger: "3" }] },
      { name: "Mi Menor (Em)", subtitle: "Oscuro y profundo", fretPositions: [{ string: 1, fret: 2, finger: "1" }, { string: 2, fret: 3, finger: "2" }, { string: 3, fret: 4, finger: "3" }] }
    ],
    "guitar": [
      { name: "Do Mayor (C)", subtitle: "Acorde clásico indispensable", fretPositions: [{ string: 2, fret: 1, finger: "1" }, { string: 4, fret: 2, finger: "2" }, { string: 5, fret: 3, finger: "3" }] },
      { name: "Sol Mayor (G)", subtitle: "Campestre y vibrante", fretPositions: [{ string: 1, fret: 3, finger: "3" }, { string: 5, fret: 2, finger: "1" }, { string: 6, fret: 3, finger: "2" }] },
      { name: "La Menor (Am)", subtitle: "Suave, triste y popular", fretPositions: [{ string: 2, fret: 1, finger: "1" }, { string: 3, fret: 2, finger: "3" }, { string: 4, fret: 2, finger: "2" }] },
      { name: "Mi Mayor (E)", subtitle: "Profundo y lleno de fuerza", fretPositions: [{ string: 3, fret: 1, finger: "1" }, { string: 4, fret: 2, finger: "3" }, { string: 5, fret: 2, finger: "2" }] },
      { name: "Re Mayor (D)", subtitle: "Limpieza cristalina", fretPositions: [{ string: 1, fret: 2, finger: "2" }, { string: 2, fret: 3, finger: "3" }, { string: 3, fret: 2, finger: "1" }] },
      { name: "Fa Mayor (F)", subtitle: "Cejilla completa en traste 1", fretPositions: [{ string: 1, fret: 1, finger: "1" }, { string: 2, fret: 1, finger: "1" }, { string: 3, fret: 2, finger: "2" }, { string: 4, fret: 3, finger: "4" }, { string: 5, fret: 3, finger: "3" }, { string: 6, fret: 1, finger: "1" }] }
    ],
    "violin": [
      { name: "Sol (G3)", subtitle: "4ª cuerda al aire", fretPositions: [{ string: 4, fret: 0, finger: "0" }] },
      { name: "Re (D4)", subtitle: "3ª cuerda al aire", fretPositions: [{ string: 3, fret: 0, finger: "0" }] },
      { name: "La (A4)", subtitle: "2ª cuerda al aire", fretPositions: [{ string: 2, fret: 0, finger: "0" }] },
      { name: "Mi (E5)", subtitle: "1ª cuerda al aire", fretPositions: [{ string: 1, fret: 0, finger: "0" }] },
      { name: "La (A3)", subtitle: "4ª cuerda, 1er dedo", fretPositions: [{ string: 4, fret: 2, finger: "1" }] },
      { name: "Si (B3)", subtitle: "4ª cuerda, 2do dedo", fretPositions: [{ string: 4, fret: 4, finger: "2" }] },
      { name: "Do (C4)", subtitle: "4ª cuerda, 3er dedo", fretPositions: [{ string: 4, fret: 5, finger: "3" }] }
    ],
    "piano": [
      { name: "Do (C4)", subtitle: "Tecla blanca izquierda de las 2 negras", pianoKeys: [0] },
      { name: "Re (D4)", subtitle: "Tecla blanca central de las 2 negras", pianoKeys: [2] },
      { name: "Mi (E4)", subtitle: "Tecla blanca derecha de las 2 negras", pianoKeys: [4] },
      { name: "Fa (F4)", subtitle: "Tecla blanca izquierda de las 3 negras", pianoKeys: [5] },
      { name: "Sol (G4)", subtitle: "1ª tecla blanca interior de las 3 negras", pianoKeys: [7] },
      { name: "La (A4)", subtitle: "2ª tecla blanca interior de las 3 negras", pianoKeys: [9] },
      { name: "Si (B4)", subtitle: "Tecla blanca derecha de las 3 negras", pianoKeys: [11] }
    ]
  };

  get currentGuideNotes() {
    const instr = this.selectedInstrument();
    if (instr.startsWith('guitar')) return this.guideData['guitar'];
    return this.guideData[instr] || [];
  }

  get enrolledInstruments() {
    const stats = this.user()?.instrumentStats || {};
    return this.availableInstruments.filter(instr => !!stats[instr.id]);
  }

  get unenrolledInstruments() {
    const stats = this.user()?.instrumentStats || {};
    return this.availableInstruments.filter(instr => !stats[instr.id]);
  }

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
    
    // Persistir en el backend
    this.authService.updateOnboarding({ targetInstrument: id }).subscribe();
  }

  toggleAddInstrumentMenu() {
    this.showAddInstrumentMenu.update(prev => !prev);
  }

  inscribirInstrumento(id: string) {
    this.authService.enrollInstrument(id).subscribe({
      next: () => {
        this.selectedInstrument.set(id);
        this.cargarCanciones();
        this.showAddInstrumentMenu.set(false);
      },
      error: (err) => {
        console.error('Error al inscribir instrumento:', err);
      }
    });
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

  toggleNotesGuide() {
    this.showNotesGuide.update(prev => !prev);
    this.activeGuideNoteIndex.set(0);
  }

  selectGuideNote(index: number) {
    this.activeGuideNoteIndex.set(index);
  }
}