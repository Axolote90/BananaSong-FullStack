import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, NgZone, inject, signal, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AudioService } from '../../core/services/audio';
import { LevelService } from '../../core/services/level';
import { ProgressService } from '../../core/services/progress';
import { faPause } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

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

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [FontAwesomeModule /* ... tus otros imports ... */],
  templateUrl: './game.html', 
  styleUrl: './game.css'
})
export class GameComponent implements AfterViewInit, OnDestroy {
  // --- INYECCIONES ---
  private ngZone = inject(NgZone);
  public router = inject(Router);
  private route = inject(ActivatedRoute);
  private levelService = inject(LevelService);
  public audioService = inject(AudioService);
  private progressService = inject(ProgressService);

  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  // --- ESTADO DEL JUEGO ---
  
  faPause = faPause;
  score = signal(0);
  gamePaused = signal(false);
  isPracticeMode = signal(false); 
  gameState = signal<'playing'>('playing'); 
  
  isGameOver = signal(false);
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
  
  private hitLineX = 0; 
  private startX = 0;
  private endX = 0;
  
  // Caché de gradientes
  private bgGradient!: CanvasGradient;
  
  // Posición interpolada para el indicador tipo Yousician
  private indicatorX = -100;
  private indicatorY = -100;
  
  // Prevención de doble disparo
  private lastHitNoteName: string | null = null;
  private lastHitTime: number = 0;
  private attackConsumed: boolean = false;

  private readonly noteDefinitions: { [key: string]: { string: number, fret: number | string } } = {
    "C4": { string: 3, fret: 0 }, "E4": { string: 2, fret: 0 }, "A4": { string: 1, fret: 0 }, "G4": { string: 4, fret: 0 },
    "F4": { string: 2, fret: 1 }, "D4": { string: 3, fret: 2 }, "C#4": { string: 3, fret: 1 }, "D#4": { string: 3, fret: 2 },
    "F#4": { string: 2, fret: 2 }, "G#4": { string: 4, fret: 1 }, "A#4": { string: 4, fret: 1 }, "B4": { string: 4, fret: 4 },
    "C5": { string: 1, fret: 3 }, "C#5": { string: 1, fret: 4 },
  };

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
    if (id && id !== '0') {
      this.currentLevelId = Number(id);
      this.levelService.getLevelById(Number(id)).subscribe({
        next: (level) => {
          this.currentDifficulty.set(level.difficulty); 
          const trackData = typeof level.track_data === 'string' ? JSON.parse(level.track_data) : level.track_data;
          this.iniciarCancionReal(trackData);
          this.startGame(); // Iniciar directamente
        },
        error: (err) => console.error("Error al cargar la canción", err)
      });
    } else if (id === '0') {
      // Ya no necesitamos manejar id 0 aquí, se encarga el componente Tuner
      this.router.navigate(['/tuner']);
    }
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
    // 1. Mover las líneas a la velocidad global (afectado por el rebobinado)
    this.linePositionX -= this.scrollSpeed * this.speedMultiplier * deltaTime;
    const numLines = 13;
    const lineSpacing = (this.endX - this.startX) / numLines;

    if (this.linePositionX <= -lineSpacing) {
      this.linePositionX += lineSpacing;
    } else if (this.linePositionX >= 0) { // Si vamos en reversa
      this.linePositionX -= lineSpacing;
    }


    // --- CONTROL DE REBOBINADO ---
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
        let nombreNota = "C4"; 
        for (const [name, data] of Object.entries(this.noteDefinitions)) {
          if (data.string === notaBD.string && data.fret === notaBD.fret) { nombreNota = name; break; }
        }
        
        this.activeNotes.push({ name: nombreNota, string: notaBD.string, x: this.canvasRef.nativeElement.width + 20, status: 'pending' });
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
      const targetY = neckY + targetNote.string * (this.neckHeight / 5);
      
      if (this.indicatorX < 0) {
        this.indicatorX = targetNote.x;
        this.indicatorY = targetY;
      } else {
        this.indicatorX -= this.scrollSpeed * this.speedMultiplier * deltaTime; // Mover al mismo paso que las notas
        this.indicatorX += (targetNote.x - this.indicatorX) * 0.3; // Suavizado
        this.indicatorY += (targetY - this.indicatorY) * 0.3;
      } 

      if (this.isPracticeMode()) {
        if (targetNote.x <= this.hitLineX) {
          this.marcarNota(targetNote, 'perfect', 20);
          this.audioService.playNoteSound(targetNote.name);
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
      const stringSpacing = this.neckHeight / 5;
      const neckY = this.canvasRef.nativeElement.height * 0.4;
      const stringY = neckY + note.string * stringSpacing;
      
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
      this.isGameOver.set(true);
      const st = this.stats();
      const totalTocadas = st.perfect + st.good + st.late + st.poor + st.miss;
      
      let acc = 0;
      if (totalTocadas > 0) {
        const puntosPrecision = (st.perfect * 1) + (st.good * 0.75) + (st.late * 0.5) + (st.poor * 0.25);
        acc = (puntosPrecision / totalTocadas) * 100;
      }
      this.accuracy.set(Math.round(acc));
      
      this.audioService.stopRecording();

      // Guardar progreso si no estamos en práctica
      if (!this.isPracticeMode() && this.currentLevelId !== null) {
        let stars = 0;
        if (acc > 90) stars = 3;
        else if (acc > 70) stars = 2;
        else if (acc > 40) stars = 1;

        this.progressService.saveProgress({
          levelId: this.currentLevelId,
          score: this.score(),
          stars: stars,
          maxCombo: this.maxCombo,
          accuracy: Math.round(acc)
        }).subscribe({
          next: () => console.log('Progreso guardado correctamente.'),
          error: (err) => console.error('Error al guardar progreso:', err)
        });
      }
    });
  }

  // --- DIBUJO ---
  private draw() {
    const canvas = this.canvasRef.nativeElement;
    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    this.drawBackground(canvas);
    this.drawUkuleleNeck(canvas);
    
    this.drawMovingLines(); 
    this.drawUkuleleStrings(canvas);
    this.drawTargetIndicator(canvas); 
    this.drawNotes();
    this.drawParticles();
    
    this.drawBottomShadow(canvas);
  }

  private drawBackground(canvas: HTMLCanvasElement) {
    if (this.bgGradient) {
      this.ctx.fillStyle = this.bgGradient;
      this.ctx.fillRect(0, 0, canvas.width, canvas.height * 0.4);
    }
  }

  private drawUkuleleNeck(canvas: HTMLCanvasElement) {
    this.ctx.fillStyle = "#666"; 
    this.ctx.fillRect(0, canvas.height * 0.4, canvas.width, this.neckHeight); 
    
    this.ctx.fillStyle = "#333"; 
    this.ctx.fillRect(0, canvas.height * 0.4 + this.neckHeight, canvas.width, 20);
  }

  private drawUkuleleStrings(canvas: HTMLCanvasElement) {
    const stringSpacing = this.neckHeight / 5; 
    const neckY = canvas.height * 0.4;
    const stringWidths = [2, 2.5, 3, 2];

    for (let i = 0; i < 4; i++) {
      const y = neckY + (i + 1) * stringSpacing;
      this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(canvas.width, y);
      this.ctx.strokeStyle = i < 2 ? "#FFF" : "#F3BF23"; this.ctx.lineWidth = stringWidths[i]; this.ctx.stroke();
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

    this.ctx.strokeStyle = "#333"; this.ctx.lineWidth = 4;

    for (let i = 0; i <= numLines + 1; i++) {
      const x = this.startX + this.linePositionX + (i * lineSpacing);
      this.ctx.beginPath();
      this.ctx.moveTo(x, neckY + this.neckHeight); 
      this.ctx.lineTo(canvas.width / 2, 0); 
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  private drawTargetIndicator(canvas: HTMLCanvasElement) {
    if (!this.currentTargetNote || this.isPracticeMode()) return;

    const neckY = canvas.height * 0.4;
    const noteRadius = 14;
    const distance = this.currentTargetNote.x - this.hitLineX;
    
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
    const neckY = this.canvasRef.nativeElement.height * 0.4;
    const stringSpacing = this.neckHeight / 5; 

    for (const note of this.activeNotes) {
      const stringY = neckY + note.string * stringSpacing;
      let color1, color2;
      switch (note.status) {
        case 'perfect': color1 = "#00FFFF"; color2 = "#008888"; break; 
        case 'good':    color1 = "#00FF00"; color2 = "#009900"; break; 
        case 'late':    color1 = "#FFFF00"; color2 = "#888800"; break; 
        case 'poor':    color1 = "#FF8800"; color2 = "#884400"; break; // Naranja
        case 'miss':    color1 = "#FF0000"; color2 = "#990000"; break; 
        default:        color1 = "#FDAB07"; color2 = "#C78602"; break; 
      }
      this.ctx.save();
      this.ctx.shadowColor = color1;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath(); this.ctx.arc(note.x, stringY, 14, 0, Math.PI, true); this.ctx.fillStyle = color1; this.ctx.fill();
      this.ctx.beginPath(); this.ctx.arc(note.x, stringY, 14, 0, Math.PI, false); this.ctx.fillStyle = color2; this.ctx.fill();
      this.ctx.restore();
      
      const fretNumber = this.noteDefinitions[note.name].fret;
      this.ctx.fillStyle = "white"; this.ctx.font = "bold 14px Arial";
      this.ctx.fillText(fretNumber.toString(), note.x - 4, stringY + 5);
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