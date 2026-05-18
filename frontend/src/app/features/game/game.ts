import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, inject, signal, HostListener, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioService } from '../../core/services/audio';
import { LevelService } from '../../core/services/level';
import { ProgressService } from '../../core/services/progress';
import { faPause } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth';

interface ActiveNote {
  name: string;
  string: number;
  x: number;
  status: 'pending' | 'pending_retry' | 'perfect' | 'good' | 'late' | 'poor' | 'miss'; 
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

interface BgCircle {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedFactor: number;
}

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule, TitleCasePipe],
  templateUrl: './game.html', 
  styleUrl: './game.css'
})
export class GameComponent implements AfterViewInit, OnDestroy {
  @Input() forceMode: 'game' | 'tutorial' | null = null;
  @Input() forcedInstrument: string | null = null;
  // --- INYECCIONES ---
  private ngZone = inject(NgZone);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private levelService = inject(LevelService);
  public audioService = inject(AudioService);
  private progressService = inject(ProgressService);
  public authService = inject(AuthService);

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // --- TUTORIAL MODE ---
  public isTutorialMode = signal(false);
  public tutorialStep = signal(0);
  public tutorialDialog = signal<string | null>(null);
  public highlightArea = signal<number | 'strings' | 'note' | 'timer' | 'clef' | null>(null);
  private isTutorialPaused = false;
  private isAutoPlaying = false;

  // --- ESTADO DEL JUEGO ---
  
  faPause = faPause;
  score = signal(0);
  gamePaused = signal(false);
  isPracticeMode = signal(false); 
  gameState = signal<'playing'>('playing'); 
  
  isGameOver = signal(false);
  isLevelUp = signal(false);
  newLevel = signal(1);
  accuracy = signal(0);
  stats = signal({ perfect: 0, good: 0, late: 0, poor: 0, miss: 0 });
  currentDifficulty = signal<string>('easy');
  
  private currentLevelId: number | null = null;
  private maxCombo = 0;
  private currentCombo = 0;
  private hasStarted = false;
  
  // --- CONTADORES Y REFERENCIAS ---
  private totalNotesInLevel = 0; 
  private notesSpawned = 0; 
  private currentTargetNote: ActiveNote | null = null; 

  // --- METRÓNOMO ---
  private bpm = 120; // Pulsaciones por minuto (lo actualizaremos con la canción)
  private beatInterval = 0; // Espacio entre golpes en milisegundos
  
  // MOTOR DE TIEMPO PERFECTO
  private songData: any[] = []; 
  private currentNoteIndex = 0; 
  private gameTime = 0; 

  // --- MECÁNICA DIDÁCTICA (REWIND & RETRY) ---
  private speedMultiplier = 1;
  private isRewinding = false;
  private targetRewindTime = 0;

  // --- VARIABLES DE ANIMACIÓN ---
  private scrollSpeed = 80;
  private neckHeight = 190;
  private animationFrameId: number = 0;
  private lastFrameTime: number = 0;
  private linePositionX: number = -400;
  private activeNotes: ActiveNote[] = [];
  private particles: Particle[] = [];
  private bgCircles: BgCircle[] = [];
  
  private hitLineX = 0; 
  private startX = 0;
  private endX = 0;
  
  // Instrumento actual
  public instrument = signal<string>('ukulele');
  public stringCount = signal<number>(4);
  
  // Caché de gradientes
  private bgGradient!: CanvasGradient;
  
  // Posición interpolada para el indicador tipo Yousician
  private indicatorX = -100;
  private indicatorY = -100;
  
  // Prevención de doble disparo
  private lastHitNoteName: string | null = null;
  private lastHitTime: number = 0;
  private attackConsumed: boolean = false;

  private readonly instrumentNoteDefinitions: { [key: string]: { [key: string]: { string: number, fret: number | string } } } = {
    "ukulele": {
      "C4": { string: 3, fret: 0 }, "E4": { string: 2, fret: 0 }, "A4": { string: 1, fret: 0 }, "G4": { string: 4, fret: 0 },
      "F4": { string: 2, fret: 1 }, "D4": { string: 3, fret: 2 }, "C#4": { string: 3, fret: 1 }, "D#4": { string: 3, fret: 2 },
      "F#4": { string: 2, fret: 2 }, "G#4": { string: 4, fret: 1 }, "A#4": { string: 4, fret: 1 }, "B4": { string: 4, fret: 4 },
      "C5": { string: 1, fret: 3 }, "C#5": { string: 1, fret: 4 },
    },
    "guitar": {
      "E2": { string: 6, fret: 0 }, "A2": { string: 5, fret: 0 }, "D3": { string: 4, fret: 0 }, "G3": { string: 3, fret: 0 }, "B3": { string: 2, fret: 0 }, "E4": { string: 1, fret: 0 },
      "F2": { string: 6, fret: 1 }, "G2": { string: 6, fret: 3 }, "C3": { string: 5, fret: 3 }, "D#3": { string: 4, fret: 1 }, "E3": { string: 4, fret: 2 }, "F3": { string: 4, fret: 3 }, "A3": { string: 3, fret: 2 }, "C4": { string: 2, fret: 1 }, "D4": { string: 2, fret: 3 },
      "G4": { string: 1, fret: 3 }, "A4": { string: 1, fret: 5 }, "B4": { string: 1, fret: 7 }
    },
    "violin": {
      "G3": { string: 4, fret: 0 }, "D4": { string: 3, fret: 0 }, "A4": { string: 2, fret: 0 }, "E5": { string: 1, fret: 0 },
      "A3": { string: 4, fret: 2 }, "B3": { string: 4, fret: 4 }, "C4": { string: 4, fret: 5 },
      "E4": { string: 3, fret: 2 }, "F#4": { string: 3, fret: 4 }, "G4": { string: 3, fret: 5 },
      "B4": { string: 2, fret: 2 }, "C#5": { string: 2, fret: 4 }, "D5": { string: 2, fret: 5 },
      "F#5": { string: 1, fret: 2 }, "G#5": { string: 1, fret: 4 }, "A5": { string: 1, fret: 5 }
    },
    "flute": {
      "C4": { string: 1, fret: 0 }, "D4": { string: 2, fret: 0 }, "E4": { string: 3, fret: 0 }, "F4": { string: 4, fret: 0 },
      "G4": { string: 5, fret: 0 }, "A4": { string: 6, fret: 0 }, "B4": { string: 7, fret: 0 }, "C5": { string: 8, fret: 0 },
      "D5": { string: 9, fret: 0 }, "E5": { string: 10, fret: 0 }, "F5": { string: 11, fret: 0 }, "G5": { string: 12, fret: 0 },
      "A5": { string: 13, fret: 0 }, "B5": { string: 14, fret: 0 }, "C6": { string: 15, fret: 0 }
    },
    "piano": {
      "C4": { string: 1, fret: 0 }, "D4": { string: 2, fret: 0 }, "E4": { string: 3, fret: 0 }, "F4": { string: 4, fret: 0 },
      "G4": { string: 5, fret: 0 }, "A4": { string: 6, fret: 0 }, "B4": { string: 7, fret: 0 }, "C5": { string: 8, fret: 0 },
      "D5": { string: 9, fret: 0 }, "E5": { string: 10, fret: 0 }, "F5": { string: 11, fret: 0 }, "G5": { string: 12, fret: 0 }
    }
  };

  private get noteDefinitions() {
    const instr = this.instrument();
    if (instr.startsWith('guitar')) return this.instrumentNoteDefinitions['guitar'];
    return this.instrumentNoteDefinitions[instr] || this.instrumentNoteDefinitions['ukulele'];
  }

  get isStaffInstrument(): boolean {
    const instr = this.instrument();
    return instr === 'flute' || instr === 'piano';
  }

  private getStaffNoteY(noteName: string, centerY: number, lineSpacing: number): number {
    const stepsFromB4: { [key: string]: number } = {
      "C4": -6, "C#4": -6, "D4": -5, "D#4": -5, "E4": -4, "F4": -3, "F#4": -3, "G4": -2, "G#4": -2, "A4": -1, "A#4": -1, "B4": 0, "C5": 1, "C#5": 1, "D5": 2, "D#5": 2, "E5": 3, "F5": 4, "F#5": 4, "G5": 5, "G#5": 5, "A5": 6, "A#5": 6, "B5": 7, "C6": 8
    };
    const noteBase = noteName.replace('#', '');
    const step = stepsFromB4[noteName] !== undefined ? stepsFromB4[noteName] : (stepsFromB4[noteBase] || 0);
    return centerY - step * (lineSpacing / 2);
  }

  private getSpanishNoteName(noteName: string): string {
    const translation: { [key: string]: string } = {
      "C": "Do", "C#": "Do#", "D": "Re", "D#": "Re#", "E": "Mi", "F": "Fa", "F#": "Fa#", "G": "Sol", "G#": "Sol#", "A": "La", "A#": "La#", "B": "Si"
    };
    const base = noteName.slice(0, -1);
    return translation[base] || base;
  }

  ngAfterViewInit() {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    this.isPracticeMode.set(mode === 'auto');

    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    this.resizeCanvas();

    if (!this.isPracticeMode()) {
      this.audioService.startRecording();
    }

    this.lastFrameTime = Date.now();
    
    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });

    const id = this.route.snapshot.paramMap.get('id');
    const isTutorial = this.forceMode === 'tutorial' || this.route.snapshot.queryParamMap.get('tutorial') === 'true';

    if (isTutorial) {
      this.setupTutorial();
    } else if (id && id !== '0') {
      this.currentLevelId = Number(id);
      this.levelService.getLevelById(Number(id)).subscribe({
        next: (level) => {
          this.currentDifficulty.set(level.difficulty); 
          this.instrument.set(level.instrument || 'ukulele');
          const isGuitar = this.instrument().startsWith('guitar');
          const isFlute = this.instrument() === 'flute';
          if (isFlute) {
            this.stringCount.set(8);
            this.neckHeight = 220;
          } else {
            this.stringCount.set(isGuitar ? 6 : 4);
            this.neckHeight = isGuitar ? 250 : 190;
          }
          this.audioService.setInstrument(this.instrument());

          const trackData = typeof level.track_data === 'string' ? JSON.parse(level.track_data) : level.track_data;
          this.iniciarCancionReal(trackData);
          this.startGame(); 
        },
        error: (err) => console.error("Error al cargar la canción", err)
      });
    } else if (id === '0') {
      this.router.navigate(['/tuner']);
    }
  }

  setupTutorial() {
    this.isTutorialMode.set(true);
    
    // Obtener el instrumento activo seleccionado por el usuario desde input, query params o AuthService (con fallback universal)
    const urlParams = new URLSearchParams(window.location.search);
    const queryInstrument = this.forcedInstrument || this.route.snapshot.queryParamMap.get('instrument') || urlParams.get('instrument');
    const userInstrument = queryInstrument || this.authService.currentUser()?.targetInstrument || 'ukulele';
    const isGuitar = userInstrument.startsWith('guitar');
    const isFlute = userInstrument === 'flute';

    this.instrument.set(userInstrument);
    
    if (isFlute) {
      this.stringCount.set(8); // Escala de 8 notas en el pentagrama para el tutorial
      this.neckHeight = 220;
    } else {
      this.stringCount.set(isGuitar ? 6 : 4);
      this.neckHeight = isGuitar ? 250 : 190;
    }
    
    this.audioService.setInstrument(userInstrument);
    
    this.isTutorialPaused = true;
    this.isAutoPlaying = false;

    // Track para demostración y posterior prueba del jugador
    const tutorialTrack = [];
    if (isFlute) {
      // Flauta (Escala diatónica C4 a C5)
      // Notas de Demostración
      tutorialTrack.push(
        { time: -4000, string: 1, fret: 0 },
        { time: -3500, string: 2, fret: 0 },
        { time: -3000, string: 3, fret: 0 },
        { time: -2500, string: 4, fret: 0 },
        { time: -2000, string: 5, fret: 0 },
        { time: -1500, string: 6, fret: 0 },
        { time: -1000, string: 7, fret: 0 },
        { time: -500, string: 8, fret: 0 }
      );
      // Notas del Jugador
      tutorialTrack.push(
        { time: 10000, string: 1, fret: 0 },
        { time: 11500, string: 2, fret: 0 },
        { time: 13000, string: 3, fret: 0 },
        { time: 14500, string: 4, fret: 0 },
        { time: 16000, string: 5, fret: 0 },
        { time: 17500, string: 6, fret: 0 },
        { time: 19000, string: 7, fret: 0 },
        { time: 20500, string: 8, fret: 0 }
      );
    } else if (isGuitar) {
      // Notas de Demostración (6 cuerdas al aire)
      tutorialTrack.push(
        { time: -3000, string: 6, fret: 0 },
        { time: -2500, string: 5, fret: 0 },
        { time: -2000, string: 4, fret: 0 },
        { time: -1500, string: 3, fret: 0 },
        { time: -1000, string: 2, fret: 0 },
        { time: -500, string: 1, fret: 0 }
      );
      // Notas del Jugador (6 cuerdas al aire)
      tutorialTrack.push(
        { time: 10000, string: 6, fret: 0 },
        { time: 11500, string: 5, fret: 0 },
        { time: 13000, string: 4, fret: 0 },
        { time: 14500, string: 3, fret: 0 },
        { time: 16000, string: 2, fret: 0 },
        { time: 17500, string: 1, fret: 0 }
      );
    } else {
      // Ukelele (4 cuerdas)
      // Notas de Demostración
      tutorialTrack.push(
        { time: -2000, string: 4, fret: 0 },
        { time: -1500, string: 3, fret: 0 },
        { time: -1000, string: 2, fret: 0 },
        { time: -500, string: 1, fret: 0 }
      );
      // Notas del Jugador
      tutorialTrack.push(
        { time: 10000, string: 4, fret: 0 },
        { time: 11500, string: 3, fret: 0 },
        { time: 13000, string: 2, fret: 0 },
        { time: 14500, string: 1, fret: 0 }
      );
    }

    this.iniciarCancionReal(tutorialTrack);
    this.startGame();
    this.runTutorialStep(1);
  }

  get maxTutorialStep(): number {
    if (this.instrument() === 'flute') return 7;
    return this.stringCount() === 6 ? 12 : 9;
  }

  runTutorialStep(step: number) {
    this.tutorialStep.set(step);
    this.isTutorialPaused = true;
    this.isAutoPlaying = false;
    this.highlightArea.set(null);

    const isGuitar = this.instrument().startsWith('guitar');
    const isFlute = this.instrument() === 'flute';

    if (isFlute) {
      switch (step) {
        case 1:
          this.tutorialDialog.set("¡Bienvenido a Banana Song! Este es el nuevo motor de Pentagrama para la flauta.");
          break;
        case 2:
          this.tutorialDialog.set("Las notas no se leen en cuerdas, sino sobre las 5 líneas y 4 espacios de este Pentagrama.");
          this.highlightArea.set('strings');
          break;
        case 3:
          this.tutorialDialog.set("Al inicio verás la Clave de Sol 𝄞, que indica la altura de los sonidos en el pentagrama.");
          this.highlightArea.set('clef');
          break;
        case 4:
          this.tutorialDialog.set("Las notas aparecerán con su nombre en español (Do, Re, Mi...) para que sepas exactamente qué nota soplar.");
          this.highlightArea.set('note');
          this.isTutorialPaused = false;
          setTimeout(() => { this.isTutorialPaused = true; }, 3500); 
          break;
        case 5:
          this.tutorialDialog.set("Cuando el círculo de tiempo llegue a la nota, debes soplar esa nota. ¡Mira cómo lo hace la demostración!");
          this.highlightArea.set('timer');
          break;
        case 6:
          this.tutorialDialog.set(null);
          this.isTutorialPaused = false;
          this.isAutoPlaying = true;
          this.speedMultiplier = 2.0; // Velocidad cómoda para la escala
          break;
        case 7:
          this.speedMultiplier = 1;
          this.tutorialDialog.set("¡Ahora es tu turno! Toca las notas de la escala cuando crucen el círculo.");
          this.isTutorialPaused = false;
          this.isAutoPlaying = false;
          break;
      }
      return;
    }

    if (isGuitar) {
      switch (step) {
        case 1:
          this.tutorialDialog.set("¡Bienvenido a Banana Song! Esta es tu guitarra de 6 cuerdas.");
          break;
        case 2:
          this.tutorialDialog.set("Tiene 6 cuerdas. Empecemos de la más gruesa a la más delgada. La 6ª cuerda (hasta abajo) es MI (E).");
          this.highlightArea.set(6);
          break;
        case 3:
          this.tutorialDialog.set("La 5ª cuerda es LA (A).");
          this.highlightArea.set(5);
          break;
        case 4:
          this.tutorialDialog.set("La 4ª cuerda es RE (D).");
          this.highlightArea.set(4);
          break;
        case 5:
          this.tutorialDialog.set("La 3ª cuerda es SOL (G).");
          this.highlightArea.set(3);
          break;
        case 6:
          this.tutorialDialog.set("La 2ª cuerda es SI (B).");
          this.highlightArea.set(2);
          break;
        case 7:
          this.tutorialDialog.set("Y la 1ª cuerda (hasta arriba, la más delgada) es MI (E).");
          this.highlightArea.set(1);
          break;
        case 8:
          this.tutorialDialog.set("Cada cuerda tiene un color y frecuencia distinta para que las identifiques de inmediato.");
          this.highlightArea.set('strings');
          break;
        case 9:
          this.tutorialDialog.set("Estas son las notas. El número indica en qué traste debes poner tu dedo.");
          this.highlightArea.set('note');
          // Dejar que corra un poco de tiempo para mostrar las notas y luego pausar
          this.isTutorialPaused = false;
          setTimeout(() => { this.isTutorialPaused = true; }, 3500); 
          break;
        case 10:
          this.tutorialDialog.set("Cuando el círculo de tiempo llegue a la nota, debes tocarla. Mira cómo se hace:");
          this.highlightArea.set('timer');
          break;
        case 11:
          this.tutorialDialog.set(null); // Ocultar diálogo para la demostración
          this.isTutorialPaused = false;
          this.isAutoPlaying = true;
          this.speedMultiplier = 2.5; // Acelerar demostración
          break;
        case 12:
          this.speedMultiplier = 1;
          this.tutorialDialog.set("¡Ahora es tu turno! Toca las 6 cuerdas al aire cuando lleguen al círculo.");
          this.isTutorialPaused = false;
          this.isAutoPlaying = false;
          break;
      }
    } else {
      // Ukelele (9 pasos originales)
      switch (step) {
        case 1:
          this.tutorialDialog.set("¡Bienvenido a Banana Song! Este es tu ukelele.");
          break;
        case 2:
          this.tutorialDialog.set("Tiene 4 cuerdas. La de hasta abajo (más cercana a ti) es SOL (G)...");
          this.highlightArea.set(4);
          break;
        case 3:
          this.tutorialDialog.set("...arriba de esa está DO (C)...");
          this.highlightArea.set(3);
          break;
        case 4:
          this.tutorialDialog.set("...luego sigue MI (E)...");
          this.highlightArea.set(2);
          break;
        case 5:
          this.tutorialDialog.set("...y la de hasta arriba es LA (A).");
          this.highlightArea.set(1);
          break;
        case 6:
          this.tutorialDialog.set("Estas son las notas. El número indica en qué traste debes poner tu dedo.");
          this.highlightArea.set('note');
          this.isTutorialPaused = false;
          setTimeout(() => { this.isTutorialPaused = true; }, 3500); 
          break;
        case 7:
          this.tutorialDialog.set("Cuando el círculo de tiempo llegue a la nota, debes tocarla. Mira cómo se hace:");
          this.highlightArea.set('timer');
          break;
        case 8:
          this.tutorialDialog.set(null);
          this.isTutorialPaused = false;
          this.isAutoPlaying = true;
          this.speedMultiplier = 2.5;
          break;
        case 9:
          this.speedMultiplier = 1;
          this.tutorialDialog.set("¡Ahora es tu turno! Toca las 4 cuerdas al aire cuando lleguen.");
          this.isTutorialPaused = false;
          this.isAutoPlaying = false;
          break;
      }
    }
  }

  nextTutorialStep() {
    this.runTutorialStep(this.tutorialStep() + 1);
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationFrameId);
    this.audioService.stopRecording();
  }

  // --- CONTROLES ---
@HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    // Mantenemos Escape para PC por comodidad
    if (event.key === 'Escape' && !this.isGameOver()) {
      this.togglePause();
    }
  }

@HostListener('window:blur')
  onWindowBlur() {
    if (!this.gamePaused() && !this.isGameOver()) {
      this.togglePause();
    }
  }

togglePause() {
    this.gamePaused.set(!this.gamePaused());
    if (!this.gamePaused()) {
      this.lastFrameTime = Date.now();
      this.ngZone.runOutsideAngular(() => this.gameLoop());
    }
  }

  exitGame() {
    this.router.navigate(['/menu']);
  }

  startGame() {
    this.audioService.resumeAudio(); // Desbloquear Web Audio API con este clic
    this.gameState.set('playing');
    this.lastFrameTime = Date.now();
    
    if (!this.hasStarted) {
      this.hasStarted = true;
      // Forzamos el reloj al inicio del countdown (-3000 ms)
      this.gameTime = -3000 - 1;
    }
  }



  restartGame() {
    this.gamePaused.set(false);
    this.isGameOver.set(false);
    this.gameState.set('playing');
    
    this.score.set(0);
    this.accuracy.set(0);
    this.stats.set({ perfect: 0, good: 0, late: 0, poor: 0, miss: 0 });
    this.currentCombo = 0;
    this.maxCombo = 0;
    this.speedMultiplier = 1;
    this.isRewinding = false;
    this.hasStarted = true; // El reinicio arranca directo
    
    this.activeNotes = [];
    this.particles = [];
    this.indicatorX = -100;
    this.currentTargetNote = null;
    this.lastHitNoteName = null;
    this.lastHitTime = 0;
    this.attackConsumed = false;
    
    if (!this.isPracticeMode()) {
       this.audioService.startRecording();
    }
    
    this.iniciarCancionReal(this.songData); // Reinicia config y reloj
    
    this.lastFrameTime = Date.now();
    cancelAnimationFrame(this.animationFrameId);
    this.ngZone.runOutsideAngular(() => this.gameLoop());
  }

  // --- MOTOR PRINCIPAL ---
  private gameLoop = () => {
    if (this.gamePaused() || this.isGameOver()) return;

    const now = Date.now();
    // ✨ Límite de tiempo (0.1s max) para evitar teletransportes si hay lag
    const deltaTime = Math.min((now - this.lastFrameTime) / 1000, 0.1); 
    this.lastFrameTime = now;

    this.updateLogic(deltaTime);
    this.draw();

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  private updateLogic(deltaTime: number) {
    // Mover círculos de fondo flotantes a la misma velocidad y dirección que el scroll del juego
    const songSpeed = this.scrollSpeed * this.speedMultiplier * deltaTime;
    const canvasWidth = this.canvasRef.nativeElement.width;
    
    for (let i = this.bgCircles.length - 1; i >= 0; i--) {
      const c = this.bgCircles[i];
      c.x -= songSpeed * c.speedFactor;
      
      // Desvanecerse conforme se acercan al lado izquierdo (x < canvasWidth * 0.35)
      const fadeThreshold = canvasWidth * 0.35;
      if (c.x < fadeThreshold) {
        c.opacity = Math.max(0, (c.x / fadeThreshold) * 0.15);
      }
      
      // Si salen de la pantalla por la izquierda (o por la derecha si rebobinamos)
      if (c.x < -20) {
        this.bgCircles[i] = {
          x: canvasWidth + 20,
          y: Math.random() * (this.canvasRef.nativeElement.height * 0.4),
          radius: Math.random() * 6 + 2,
          opacity: Math.random() * 0.15 + 0.05,
          speedFactor: Math.random() * 0.3 + 0.85
        };
      } else if (c.x > canvasWidth + 40) {
        this.bgCircles[i] = {
          x: -10,
          y: Math.random() * (this.canvasRef.nativeElement.height * 0.4),
          radius: Math.random() * 6 + 2,
          opacity: Math.random() * 0.15 + 0.05,
          speedFactor: Math.random() * 0.3 + 0.85
        };
      }
    }

    // 1. Mover las líneas a la velocidad global (afectado por el rebobinado)
    this.linePositionX -= this.scrollSpeed * this.speedMultiplier * deltaTime;
    const numLines = 13;
    const lineSpacing = (this.endX - this.startX) / numLines;

    if (this.linePositionX <= -lineSpacing) {
      this.linePositionX += lineSpacing;
    } else if (this.linePositionX >= 0) { // Si vamos en reversa
      this.linePositionX -= lineSpacing;
    }


    // --- CONTROL DE REBOBINADO Y TUTORIAL ---
    if (this.isTutorialMode() && this.isTutorialPaused) {
      // En modo tutorial pausado, no avanzamos el tiempo
      return;
    }

    if (this.isRewinding) {
      if (this.gameTime <= this.targetRewindTime) {
        this.isRewinding = false;
        this.speedMultiplier = 0.5; // Cámara lenta (50%) para dar tiempo al jugador de prepararse
      }
    }

    // ✨ 2. AVANZAR EL RELOJ INTERNO (Afectado por speedMultiplier)
    const previousTime = this.gameTime;
    this.gameTime += deltaTime * 1000 * this.speedMultiplier; 

    // ✨ LÓGICA DEL METRÓNOMO ✨
    // Solo suena si vamos hacia adelante
    if (this.beatInterval > 0 && this.speedMultiplier > 0) {
      const currentBeat = Math.floor(this.gameTime / this.beatInterval);
      const previousBeat = Math.floor(previousTime / this.beatInterval);
      if (currentBeat > previousBeat) {
        this.audioService.reproducirClickMetronomo();
      }
    }

    // ✨ 3. LECTOR DE PARTITURAS (Genera las notas basadas en el reloj, no en setTimeout)
    while (this.currentNoteIndex < this.songData.length) {
      const notaBD = this.songData[this.currentNoteIndex];
      
      if (this.gameTime >= notaBD.time) {
        let nombreNota = notaBD.name || "C4"; 
        if (!notaBD.name) {
          for (const [name, data] of Object.entries(this.noteDefinitions)) {
            if (String(data.string) === String(notaBD.string) && String(data.fret) === String(notaBD.fret)) { 
              nombreNota = name; 
              break; 
            }
          }
        }
        
        this.activeNotes.push({ name: nombreNota, string: Number(notaBD.string), x: this.canvasRef.nativeElement.width + 20, status: 'pending' });
        this.notesSpawned++;
        this.currentNoteIndex++; 
      } else {
        break; // Aún no es tiempo de la siguiente nota
      }
    }

    const notaDetectadaVoz = this.audioService.currentNote();
    const isAttack = this.audioService.isAttack();

    // Resetear consumo de ataque si el estado de ataque ya pasó
    if (!isAttack) {
      this.attackConsumed = false;
    }

    // 4. Lógica de Colisión (Hit Windows)
    const targetNoteIndex = this.activeNotes.findIndex(n => n.status === 'pending' || n.status === 'pending_retry');

    if (targetNoteIndex !== -1) {
      this.currentTargetNote = this.activeNotes[targetNoteIndex];
      const targetNote = this.currentTargetNote;
      const distancia = Math.abs(targetNote.x - this.hitLineX); 

      // 🔥 FIX DEL INDICADOR: Interpolación en updateLogic para compensar la velocidad
      const neckY = this.canvasRef.nativeElement.height * 0.4;
      const centerY = neckY + this.neckHeight / 2;
      const lineSpacing = 16;
      const targetY = this.isStaffInstrument
        ? this.getStaffNoteY(targetNote.name, centerY, lineSpacing)
        : neckY + targetNote.string * (this.neckHeight / (this.stringCount() + 1));
      
      if (this.indicatorX < 0) {
        this.indicatorX = targetNote.x;
        this.indicatorY = targetY;
      } else {
        this.indicatorX -= this.scrollSpeed * this.speedMultiplier * deltaTime; // Mover al mismo paso que las notas
        this.indicatorX += (targetNote.x - this.indicatorX) * 0.3; // Suavizado
        this.indicatorY += (targetY - this.indicatorY) * 0.3;
      } 

      if (this.isPracticeMode() || (this.isTutorialMode() && this.isAutoPlaying)) {
        if (targetNote.x <= this.hitLineX) {
          this.marcarNota(targetNote, 'perfect', 20);
          this.audioService.playNoteSound(targetNote.name);
          
          const isFlute = this.instrument() === 'flute';
          const demoStep = isFlute ? 6 : (this.stringCount() === 6 ? 11 : 8);
          if (this.isTutorialMode() && this.tutorialStep() === demoStep) {
            // Cuando la demostración termine de tocar todas las notas
            const requiredPerfect = isFlute ? 8 : (this.stringCount() === 6 ? 6 : 4);
            if (this.stats().perfect >= requiredPerfect && this.isAutoPlaying) {
              this.isAutoPlaying = false; // Detener auto-play instantáneamente
              this.speedMultiplier = 1; // Volver a la velocidad normal INMEDIATAMENTE
              setTimeout(() => { this.nextTutorialStep(); }, 1500);
            }
          }
        }
      } 
      else {
        // Solo evaluamos el hit si el juego NO está rebobinando
        if (!this.isRewinding) {
          const now = Date.now();
          const isSameNote = notaDetectadaVoz === this.lastHitNoteName;
          const timeSinceLastHit = now - this.lastHitTime;

          // CRITERIO ULTRA-ESTRICTO: 
          // 1. Si es la misma nota, necesitamos un ataque NUEVO (no consumido)
          // 2. O que haya pasado mucho tiempo (debounce de respaldo)
          const allowHit = !isSameNote || (isAttack && !this.attackConsumed) || timeSinceLastHit > 450;

          if (notaDetectadaVoz === targetNote.name && distancia < 80 && allowHit) { 
            const isRetry = targetNote.status === 'pending_retry';
            
            this.lastHitNoteName = targetNote.name;
            this.lastHitTime = now;
            if (isAttack) this.attackConsumed = true; // Consumir este ataque
            
            if (distancia <= 20) { this.marcarNota(targetNote, isRetry ? 'poor' : 'perfect', isRetry ? 5 : 20); } 
            else if (distancia <= 50) { this.marcarNota(targetNote, isRetry ? 'poor' : 'good', isRetry ? 2 : 10); } 
            else { this.marcarNota(targetNote, isRetry ? 'poor' : 'late', isRetry ? 0 : 5); } 
            
            // Si estábamos en cámara lenta, volvemos a la normalidad instantáneamente
            if (this.speedMultiplier < 1) {
              this.speedMultiplier = 1;
            }
          }
        }
      }

      // Si falla la nota (la dejó pasar)
      if (!this.isRewinding && (targetNote.status === 'pending' || targetNote.status === 'pending_retry') && targetNote.x < this.hitLineX - 80) {
        if (this.isPracticeMode()) {
          this.marcarNota(targetNote, 'miss', 0);
        } else {
          // --- MECÁNICA DE CASTIGO DIDÁCTICO ---
          targetNote.status = 'pending_retry';
          this.currentCombo = 0;
          this.triggerScreenShake();
          
          this.isRewinding = true;
          this.speedMultiplier = -3; // Retrocede en el tiempo x3 rápido
          // Retrocedemos 2.5 segundos para dar tiempo, pero no antes del inicio
          this.targetRewindTime = Math.max(-3000, this.gameTime - 2500);
        }
      }
    } else {
      this.currentTargetNote = null;
    }

    // 5. Mover las notas
    for (let i = this.activeNotes.length - 1; i >= 0; i--) {
      this.activeNotes[i].x -= this.scrollSpeed * this.speedMultiplier * deltaTime; 
      
      if (this.activeNotes[i].x < -50) {
        this.activeNotes.splice(i, 1);
      }
    }

    // 5.5 Actualizar partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 6. Revisar si el juego terminó
    if (this.totalNotesInLevel > 0 && 
        this.notesSpawned === this.totalNotesInLevel && 
        this.activeNotes.length === 0) {
      this.finalizarJuego();
    }
  }

  private marcarNota(note: ActiveNote, status: 'perfect' | 'good' | 'late' | 'poor' | 'miss', points: number) {
    note.status = status;
    
    // Lanzar partículas
    if (status === 'perfect' || status === 'good' || status === 'poor') {
      const neckY = this.canvasRef.nativeElement.height * 0.4;
      const centerY = neckY + this.neckHeight / 2;
      const lineSpacing = 16;
      const stringY = this.isStaffInstrument
        ? this.getStaffNoteY(note.name, centerY, lineSpacing)
        : neckY + note.string * (this.neckHeight / (this.stringCount() + 1));
      
      let particleColor = '#00FFFF';
      if (status === 'good') particleColor = '#00FF00';
      if (status === 'poor') particleColor = '#FF8800'; // Naranja para deficiente
      
      this.spawnParticles(note.x, stringY, particleColor);
      
      // Deficiente no aumenta el combo
      if (status !== 'poor') {
        this.currentCombo++;
        if (this.currentCombo > this.maxCombo) this.maxCombo = this.currentCombo;
      }
    } else if (status === 'miss') {
      this.currentCombo = 0;
    }

    this.ngZone.run(() => {
      if (points > 0) this.score.update(s => s + points);
      const currentStats = this.stats();
      if (status in currentStats) {
        this.stats.set({ ...currentStats, [status]: (currentStats as any)[status] + 1 });
      }
    });
  }

  private spawnParticles(x: number, y: number, color: string) {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 400,
        vy: (Math.random() - 0.5) * 400,
        life: 0.5 + Math.random() * 0.3,
        maxLife: 0.8,
        color,
        size: Math.random() * 4 + 2
      });
    }
  }

  private finalizarJuego() {
    this.ngZone.run(() => {
      this.audioService.stopRecording();

      if (this.isTutorialMode()) {
        this.tutorialDialog.set("¡Felicidades, terminaste el tutorial!");
        this.highlightArea.set(null);
        setTimeout(() => {
          this.router.navigate(['/menu'], { queryParams: { tutorial: 'true' } });
        }, 3000);
        return;
      }

      this.isGameOver.set(true);
      const st = this.stats();
      const totalTocadas = st.perfect + st.good + st.late + st.poor + st.miss;
      
      let acc = 0;
      if (totalTocadas > 0) {
        const puntosPrecision = (st.perfect * 1) + (st.good * 0.75) + (st.late * 0.5) + (st.poor * 0.25);
        acc = (puntosPrecision / totalTocadas) * 100;
      }
      this.accuracy.set(Math.round(acc));

      // Guardar progreso si no estamos en práctica
      if (!this.isPracticeMode() && this.currentLevelId !== null) {
        let stars = 0;
        if (acc > 90) stars = 3;
        else if (acc > 70) stars = 2;
        else if (acc > 40) stars = 1;

        const oldLevel = this.authService.currentUser()?.instrumentStats?.[this.instrument()]?.level || 1;

        this.progressService.saveProgress({
          levelId: this.currentLevelId,
          score: this.score(),
          stars: stars,
          maxCombo: this.maxCombo,
          accuracy: Math.round(acc)
        }).subscribe({
          next: (res) => {
            console.log('Progreso guardado correctamente.');
            const newLevel = res.userStats?.instrumentStats?.[this.instrument()]?.level || 1;
            if (newLevel > oldLevel) {
              this.newLevel.set(newLevel);
              this.isLevelUp.set(true);
              this.spawnLevelUpConfetti();
            }
          },
          error: (err) => console.error('Error al guardar progreso:', err)
        });
      }
    });
  }

  private spawnLevelUpConfetti() {
    // Generar muchas partículas de colores
    const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6'];
    for (let i = 0; i < 100; i++) {
      this.spawnParticles(
        Math.random() * this.canvasRef.nativeElement.width,
        Math.random() * this.canvasRef.nativeElement.height,
        colors[Math.floor(Math.random() * colors.length)]
      );
    }
  }

  // --- DIBUJO ---
  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.drawBackground(canvas);
    this.drawInstrumentNeck(canvas);
    
    this.drawMovingLines(); 
    this.drawStrings(canvas);
    this.drawTargetIndicator(canvas); 
    this.drawNotes();
    this.drawParticles();
    
    this.drawBottomShadow(canvas);
  }

  private drawBackground(canvas: HTMLCanvasElement) {
    // 1. Fondo de gris oscuro premium
    this.ctx.fillStyle = "#16161a";
    this.ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
    
    // 2. Dibujar círculos de fondo flotantes
    this.ctx.save();
    for (const c of this.bgCircles) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${c.opacity})`;
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();

    // 3. Gradiente sutil cacheado de desvanecimiento hacia el mástil
    if (this.bgGradient) {
      this.ctx.fillStyle = this.bgGradient;
      this.ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
    }
  }

  private drawInstrumentNeck(canvas: HTMLCanvasElement) {
    const instr = this.instrument();
    const neckY = canvas.height * 0.4;

    if (this.isStaffInstrument) {
      // Dibujar un elegante fondo de pentagrama premium (estilo cristal de noche)
      const grad = this.ctx.createLinearGradient(0, neckY, 0, neckY + this.neckHeight);
      grad.addColorStop(0, "rgba(10, 10, 20, 0.9)");
      grad.addColorStop(1, "rgba(25, 20, 45, 0.95)");
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, neckY, canvas.width, this.neckHeight);
      
      // Borde de neón azul sutil arriba y abajo para darle un toque premium
      this.ctx.strokeStyle = "rgba(0, 191, 255, 0.4)";
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(0, neckY);
      this.ctx.lineTo(canvas.width, neckY);
      this.ctx.moveTo(0, neckY + this.neckHeight);
      this.ctx.lineTo(canvas.width, neckY + this.neckHeight);
      this.ctx.stroke();
      return;
    }

    // Configurar gradientes de madera en 3D súper pulidos para simular un mástil real
    let neckGrad = this.ctx.createLinearGradient(0, neckY, 0, neckY + this.neckHeight);

    if (instr === 'guitar_acoustic') {
      neckGrad.addColorStop(0, "#2c1303");      // Sombra superior profunda
      neckGrad.addColorStop(0.15, "#5d2906");   // Madera de palisandro/caoba
      neckGrad.addColorStop(0.45, "#8f4415");   // Reflejo brillante cilíndrico
      neckGrad.addColorStop(0.75, "#5d2906");
      neckGrad.addColorStop(1, "#180a01");      // Sombra inferior
    } else if (instr === 'guitar_electric') {
      neckGrad.addColorStop(0, "#080812");
      neckGrad.addColorStop(0.2, "#13132e");
      neckGrad.addColorStop(0.5, "#2d2d6d");    // Azul eléctrico metalizado
      neckGrad.addColorStop(0.8, "#13132e");
      neckGrad.addColorStop(1, "#030308");
    } else if (instr === 'violin') {
      neckGrad.addColorStop(0, "#1c0d0c");
      neckGrad.addColorStop(0.25, "#422624");
      neckGrad.addColorStop(0.5, "#6d3834");    // Brillo caoba
      neckGrad.addColorStop(0.75, "#422624");
      neckGrad.addColorStop(1, "#0f0505");
    } else {
      // Ukelele por defecto (Madera de Koa dorada exótica)
      neckGrad.addColorStop(0, "#3e2007");      // Sombra superior
      neckGrad.addColorStop(0.15, "#7a430c");   // Tonalidad Koa
      neckGrad.addColorStop(0.45, "#b56c23");   // Brillo dorado miel
      neckGrad.addColorStop(0.75, "#7a430c");
      neckGrad.addColorStop(1, "#271402");      // Sombra inferior
    }

    // Dibujar el mástil principal
    this.ctx.fillStyle = neckGrad; 
    this.ctx.fillRect(0, neckY, canvas.width, this.neckHeight); 
    
    // Diapasón / Filo del mástil (efecto madera cortada / relieve en 3D)
    const edgeGrad = this.ctx.createLinearGradient(0, neckY + this.neckHeight, 0, neckY + this.neckHeight + 12);
    edgeGrad.addColorStop(0, "#110703");
    edgeGrad.addColorStop(0.5, "#251206");
    edgeGrad.addColorStop(1, "#000000");
    this.ctx.fillStyle = edgeGrad; 
    this.ctx.fillRect(0, neckY + this.neckHeight, canvas.width, 12);

    // Dibujar una cejilla física (Nut) pulida y elegante de marfil a la altura del hitLineX
    const nutWidth = 10;
    const nutX = this.hitLineX - nutWidth / 2;
    const nutGrad = this.ctx.createLinearGradient(nutX, 0, nutX + nutWidth, 0);
    nutGrad.addColorStop(0, "#c4b197");
    nutGrad.addColorStop(0.4, "#fdfaf0"); // Reflejo brillante de marfil
    nutGrad.addColorStop(1, "#9e8971");
    
    this.ctx.save();
    this.ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    this.ctx.shadowBlur = 6;
    this.ctx.shadowOffsetX = 2.5;
    
    this.ctx.fillStyle = nutGrad;
    this.ctx.fillRect(nutX, neckY, nutWidth, this.neckHeight);
    
    this.ctx.strokeStyle = "rgba(0,0,0,0.25)";
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(nutX, neckY, nutWidth, this.neckHeight);
    this.ctx.restore();
  }

  private drawStrings(canvas: HTMLCanvasElement) {
    if (this.isStaffInstrument) {
      const centerY = canvas.height * 0.4 + this.neckHeight / 2;
      const lineSpacing = 16;
      const highlight = this.highlightArea();

      // Dibujar las 5 líneas del pentagrama
      for (let i = -2; i <= 2; i++) {
        const y = centerY + i * lineSpacing;
        this.ctx.beginPath();
        this.ctx.moveTo(0, y);
        this.ctx.lineTo(canvas.width, y);
        
        this.ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
        this.ctx.lineWidth = 1.5;

        // Soporte para iluminar áreas en el tutorial de pentagrama
        if (highlight === 'strings') {
          this.ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
          this.ctx.shadowColor = "#00FFFF";
          this.ctx.shadowBlur = 8;
        }

        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
      }

      // Dibujar la clave de sol estilizada en Unicode
      this.ctx.save();
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      
      if (highlight === 'clef') {
        this.ctx.fillStyle = "rgba(0, 255, 255, 1)";
        this.ctx.shadowColor = "#00FFFF";
        this.ctx.shadowBlur = 15;
      }

      this.ctx.font = "75px Times New Roman";
      this.ctx.fillText("𝄞", this.hitLineX - 110, centerY + 25);
      this.ctx.restore();
      return;
    }

    const strings = this.stringCount();
    const stringSpacing = this.neckHeight / (strings + 1);
    const neckY = canvas.height * 0.4;
    const instr = this.instrument();

    for (let i = 0; i < strings; i++) {
      const y = neckY + (i + 1) * stringSpacing;
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(canvas.width, y);
      
      // Colores de cuerdas
      if (instr === 'guitar_electric') {
        this.ctx.strokeStyle = "#C0C0C0"; // Nickel/Steel
        this.ctx.lineWidth = 1 + (i * 0.5); // Thickness varies slightly
      } else if (instr === 'guitar_acoustic') {
        this.ctx.strokeStyle = i < 3 ? "#E8E8E8" : "#CD7F32"; // Steel and Bronze
        this.ctx.lineWidth = 1.2 + (i * 0.4);
      } else if (instr === 'violin') {
        this.ctx.strokeStyle = "#DDD"; // Gut/Steel strings
        this.ctx.lineWidth = 1.5;
      } else {
        this.ctx.strokeStyle = i < 2 ? "#FFF" : "#F3BF23"; // Ukulele
        this.ctx.lineWidth = 2;
      }
      
      // Highlight logic
      const highlight = this.highlightArea();
      if (typeof highlight === 'number') {
        if (highlight !== i + 1) {
          this.ctx.globalAlpha = 0.2; 
        } else {
          this.ctx.shadowColor = "#FFF";
          this.ctx.shadowBlur = 10;
        }
      }

      this.ctx.stroke();
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;
    }
  }

  private drawMovingLines() {
    const canvas = this.canvasRef.nativeElement;
    const neckY = canvas.height * 0.4;
    
    const numLines = 13; const lineSpacing = (this.endX - this.startX) / numLines;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.rect(0, neckY, canvas.width, this.neckHeight); 
    this.ctx.clip();

    for (let i = 0; i <= numLines + 1; i++) {
      const x = this.startX + this.linePositionX + (i * lineSpacing);
      
      // Dibujar trastes metálicos realistas en 3D en perspectiva
      // 1. Sombra discreta del traste
      this.ctx.strokeStyle = "rgba(0, 0, 0, 0.38)"; 
      this.ctx.lineWidth = 4.5;
      this.ctx.beginPath();
      this.ctx.moveTo(x + 0.8, neckY + this.neckHeight); 
      this.ctx.lineTo(canvas.width / 2 + 0.8, 0); 
      this.ctx.stroke();

      // 2. Línea de metal del traste (Plateado)
      this.ctx.strokeStyle = "#a2a2a6"; 
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(x, neckY + this.neckHeight); 
      this.ctx.lineTo(canvas.width / 2, 0); 
      this.ctx.stroke();

      // 3. Brillo de luz blanco metálico en el centro
      this.ctx.strokeStyle = "#ffffff"; 
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.moveTo(x - 0.3, neckY + this.neckHeight); 
      this.ctx.lineTo(canvas.width / 2 - 0.3, 0); 
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawTargetIndicator(canvas: HTMLCanvasElement) {
    if (!this.currentTargetNote || this.isPracticeMode()) return;

    const neckY = canvas.height * 0.4;
    const stringSpacing = this.neckHeight / (this.stringCount() + 1);
    const noteRadius = 14;
    const distance = this.currentTargetNote.x - this.hitLineX;
    
    // 🔥 FIX DEL INDICADOR: Y dinámica basada en el número de cuerdas o pentagrama
    const centerY = neckY + this.neckHeight / 2;
    const lineSpacing = 16;
    const targetY = this.isStaffInstrument
      ? this.getStaffNoteY(this.currentTargetNote.name, centerY, lineSpacing)
      : neckY + this.currentTargetNote.string * stringSpacing;
    
    // Limit drawing to when the note is approaching or just passed
    if (distance < -60 || distance > 250) return;

    this.ctx.save(); 
    this.ctx.beginPath();
    this.ctx.rect(0, neckY, canvas.width, this.neckHeight); 
    this.ctx.clip();

    // 1. Static Hit Point (Subtle ghost ring at the target location)
    // Only becomes visible as the note gets closer to provide a reference point
    const hitPointOpacity = Math.max(0, 1 - Math.abs(distance) / 100) * 0.2;
    if (hitPointOpacity > 0) {
      this.ctx.beginPath();
      this.ctx.arc(this.hitLineX, this.indicatorY, noteRadius + 3, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(255, 255, 255, ${hitPointOpacity})`;
      this.ctx.lineWidth = 1.5;
      this.ctx.setLineDash([2, 4]); // Dashed for a more subtle "target" look
      this.ctx.stroke();
      this.ctx.setLineDash([]); // Reset dash
    }

    // 2. Shrinking Approach Ring (The rhythmic cue)
    let approachRadius = noteRadius;
    let ringOpacity = 0.8;
    let ringColor = "0, 255, 255"; // Cyan by default

    if (distance > 0) {
      // Ring shrinks from large to note size as it reaches hitLineX
      // Factor 0.15 means at 200px away, ring is only 30px larger than note
      approachRadius = noteRadius + (distance * 0.15); 
      ringOpacity = Math.min(0.8, 1 - distance / 250);
      this.ctx.shadowColor = "#00FFFF";
    } else {
      // Late: Ring stays at note size, fades out and turns red/orange
      approachRadius = noteRadius;
      ringOpacity = Math.max(0, 0.8 + distance / 60);
      ringColor = "255, 100, 0"; // Orange-red for late
      this.ctx.shadowColor = "#FF6400";
    }

    this.ctx.beginPath();
    this.ctx.arc(this.currentTargetNote.x, this.indicatorY, approachRadius, 0, Math.PI * 2);
    this.ctx.strokeStyle = `rgba(${ringColor}, ${ringOpacity})`; 
    this.ctx.lineWidth = 3;
    this.ctx.shadowBlur = 12;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawNotes() {
    const canvas = this.canvasRef.nativeElement;
    const neckY = this.canvasRef.nativeElement.height * 0.4;
    const stringSpacing = this.neckHeight / (this.stringCount() + 1); 
    const centerY = neckY + this.neckHeight / 2;
    const lineSpacing = 16;

    for (const note of this.activeNotes) {
      const stringY = this.isStaffInstrument
        ? this.getStaffNoteY(note.name, centerY, lineSpacing)
        : neckY + note.string * stringSpacing;
      let color1, color2;
      switch (note.status) {
        case 'perfect': color1 = "#00FFFF"; color2 = "#008888"; break; 
        case 'good':    color1 = "#00FF00"; color2 = "#009900"; break; 
        case 'late':    color1 = "#FFFF00"; color2 = "#888800"; break; 
        case 'poor':    color1 = "#FF8800"; color2 = "#884400"; break; // Naranja
        case 'miss':    color1 = "#FF0000"; color2 = "#990000"; break; 
        default:        color1 = "#FDAB07"; color2 = "#C78602"; break; 
      }

      // Dibujar líneas adicionales para instrumentos de pentagrama
      if (this.isStaffInstrument) {
        const stepsFromB4: { [key: string]: number } = {
          "C4": -6, "C#4": -6, "D4": -5, "D#4": -5, "E4": -4, "F4": -3, "F#4": -3, "G4": -2, "G#4": -2, "A4": -1, "A#4": -1, "B4": 0, "C5": 1, "C#5": 1, "D5": 2, "D#5": 2, "E5": 3, "F5": 4, "F#5": 4, "G5": 5, "G#5": 5, "A5": 6, "A#5": 6, "B5": 7, "C6": 8
        };
        const noteBase = note.name.replace('#', '');
        const step = stepsFromB4[note.name] !== undefined ? stepsFromB4[note.name] : (stepsFromB4[noteBase] || 0);

        if (step <= -6 || step >= 6) {
          this.ctx.save();
          this.ctx.beginPath();
          this.ctx.moveTo(note.x - 22, stringY);
          this.ctx.lineTo(note.x + 22, stringY);
          this.ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
          this.ctx.restore();
        }
      }

      this.ctx.save();
      this.ctx.shadowColor = color1;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath(); this.ctx.arc(note.x, stringY, 14, 0, Math.PI, true); this.ctx.fillStyle = color1; this.ctx.fill();
      this.ctx.beginPath(); this.ctx.arc(note.x, stringY, 14, 0, Math.PI, false); this.ctx.fillStyle = color2; this.ctx.fill();
      this.ctx.restore();
      
      let textToDraw = "";
      if (this.isStaffInstrument) {
        textToDraw = this.getSpanishNoteName(note.name);
      } else {
        const def = this.noteDefinitions[note.name];
        textToDraw = def ? def.fret.toString() : "0";
      }

      this.ctx.fillStyle = "white"; 
      this.ctx.font = this.isStaffInstrument ? "bold 11px Arial" : "bold 14px Arial";
      
      const textWidth = this.ctx.measureText(textToDraw).width;
      this.ctx.fillText(textToDraw, note.x - textWidth / 2, stringY + 4);
    }
  }

  private drawParticles() {
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = alpha;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawBottomShadow(canvas: HTMLCanvasElement) {
    const shadowY = canvas.height * 0.4 + this.neckHeight;
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.75)"; 
    this.ctx.fillRect(0, shadowY, canvas.width, canvas.height - shadowY);
  }

  @HostListener('window:resize')
  resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    this.startX = -canvas.width;
    this.endX = 7 * canvas.width;
    this.hitLineX = canvas.width * 0.3; 
    
    // Generar gradientes cacheados para mejor rendimiento
    this.bgGradient = this.ctx.createLinearGradient(0, 0, 0, canvas.height * 0.4);
    this.bgGradient.addColorStop(0, "rgba(0, 0, 0, 0.0)"); 
    this.bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.6)"); 

    // Inicializar los círculos de fondo flotantes
    this.initBgCircles();
  }

  private initBgCircles() {
    const canvas = this.canvasRef.nativeElement;
    this.bgCircles = [];
    // Generar 30 círculos de fondo tenues con distribución uniforme inicial
    for (let i = 0; i < 30; i++) {
      this.bgCircles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * (canvas.height * 0.4),
        radius: Math.random() * 5 + 1.5,
        opacity: Math.random() * 0.12 + 0.03, // Muy tenue
        speedFactor: Math.random() * 0.3 + 0.85 // Viajan cercano a 1x velocidad
      });
    }
  }

  private iniciarCancionReal(trackData: any[]) {
    this.totalNotesInLevel = trackData.length;
    this.notesSpawned = 0;

    // Ordenamos las notas por tiempo de menor a mayor
    this.songData = trackData.sort((a, b) => a.time - b.time); 
    this.currentNoteIndex = 0;

    // ✨ CONFIGURAR METRÓNOMO
    // Si el nivel tiene BPM en la BD, lo usamos, si no, 120 por defecto
    this.bpm = 120; // Aquí podrías hacer: this.bpm = level.bpm || 120;
    this.beatInterval = 60000 / this.bpm; // 60k ms / BPM = ms por golpe
    
    // Restamos un milisegundo para forzar a que el metrónomo suene en el primer frame (cruce matemático)
    this.gameTime = -3000 - 1;
  }

  // --- ✨ NUEVA FUNCIÓN: Dispara el efecto visual de temblor de pantalla ✨ ---
  private triggerScreenShake() {
    // Buscamos el contenedor principal por su clase HTML
    const gameContainer = document.querySelector('.game-container') as HTMLElement;
    
    if (gameContainer) {
      // 1. Añadimos la clase que inicia la animación CSS
      gameContainer.classList.add('shake-effect');
      
      // 2. Usamos setTimeout para quitar la clase después de 300ms (0.3s)
      // Esto 'resetea' la animación para que pueda volver a ocurrir
      setTimeout(() => {
        gameContainer.classList.remove('shake-effect');
      }, 300); // Debe coincidir con la duración en el CSS
    }
  }
}