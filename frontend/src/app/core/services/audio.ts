import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioContext!: AudioContext;
  private analyser!: AnalyserNode;
  private microphone!: MediaStreamAudioSourceNode;
  private javascriptNode!: ScriptProcessorNode;
  private audioStream!: MediaStream;

  // NUEVO: Diccionario para almacenar en memoria los audios reales del ukelele
  private noteBuffers: Map<string, AudioBuffer> = new Map();

  // Angular 21 Signal: El juego "escuchará" esta variable en tiempo real
  public currentNote = signal<string | null>(null);
  public currentVolume = signal<number>(0);
  public isAttack = signal<boolean>(false);
  public tuningStatus = signal<{ note: string, cents: number, instruction: string, freq: number } | null>(null);

  private lastRms = 0;
  private attackThreshold = 2.2; // Multiplicador más estricto para detectar el rasgueo

  // Frecuencias extendidas para múltiples instrumentos (E2 a E6 aprox)
  private readonly noteFrequencies: { [key: string]: number } = {
    "E2": 82.41, "F2": 87.31, "F#2": 92.50, "G2": 98.00, "G#2": 103.83, "A2": 110.00, "A#2": 116.54, "B2": 123.47,
    "C3": 130.81, "C#3": 138.59, "D3": 146.83, "D#3": 155.56, "E3": 164.81, "F3": 174.61, "F#3": 185.00, "G3": 196.00, "G#3": 207.65, "A3": 220.00, "A#3": 233.08, "B3": 246.94,
    "C4": 261.63, "C#4": 277.18, "D4": 293.66, "D#4": 311.13, "E4": 329.63, "F4": 349.23, "F#4": 369.99, "G4": 392.00, "G#4": 415.30, "A4": 440.00, "A#4": 466.16, "B4": 493.88,
    "C5": 523.25, "C#5": 554.37, "D5": 587.33, "D#5": 622.25, "E5": 659.25, "F5": 698.46, "F#5": 739.99, "G5": 783.99, "G#5": 830.61, "A5": 880.00, "A#5": 932.33, "B5": 987.77,
    "C6": 1046.50
  };

  // Configuraciones de cuerdas por instrumento
  private readonly instrumentConfigs: { [key: string]: { strings: string[], assets: string } } = {
    "ukulele": { strings: ["G4", "C4", "E4", "A4"], assets: "ukulele" },
    "guitar": { strings: ["E2", "A2", "D3", "G3", "B3", "E4"], assets: "guitar" },
    "guitar_acoustic": { strings: ["E2", "A2", "D3", "G3", "B3", "E4"], assets: "guitar_acoustic" },
    "guitar_electric": { strings: ["E2", "A2", "D3", "G3", "B3", "E4"], assets: "guitar_electric" },
    "violin": { strings: ["G3", "D4", "A4", "E5"], assets: "violin" }
  };

  private currentInstrument = "ukulele";

  // Cuerdas actuales basadas en el instrumento seleccionado
  public get tuningStrings() {
    return this.instrumentConfigs[this.currentInstrument].strings;
  }

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.loadInstrumentSounds();
  }

  // --- NUEVO: SOPORTE MULTI-INSTRUMENTO ---
  public setInstrument(instrument: string) {
    if (this.instrumentConfigs[instrument]) {
      this.currentInstrument = instrument;
      this.noteBuffers.clear();
      this.loadInstrumentSounds();
    }
  }

  private async loadInstrumentSounds() {
    const config = this.instrumentConfigs[this.currentInstrument];
    for (const noteName of config.strings) {
      const fileName = `${noteName.toLowerCase()}.mp3`;
      await this.loadNote(noteName, `/assets/sounds/${config.assets}/${fileName}`);
    }
  }

  public resumeAudio() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async loadNote(noteName: string, fileUrl: string): Promise<void> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.noteBuffers.set(noteName, audioBuffer);
      console.log(`🎵 Cuerda real ${noteName} cargada y lista para Sampler.`);
    } catch (error) {
      console.warn(`⚠️ No se encontró el archivo real para ${noteName} en ${fileUrl}. Añádelo para el Auto-Play.`);
    }
  }

  // --- REPRODUCCIÓN REEMPLAZADA POR AUDIOS REALES (SAMPLER PITCH-SHIFT) ---
  playNoteSound(noteName: string): void {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const targetFreq = this.noteFrequencies[noteName];
    if (!targetFreq) return;

    // Magia del Sampler: Encontramos la cuerda base que el usuario proporcionó
    // que sea más cercana (y más grave) a la nota que queremos tocar.
    let bestBaseNote = "C4"; // Empezar con la más grave
    let maxBaseFreq = 0;

    for (const baseNote of this.tuningStrings) {
      const baseFreq = this.noteFrequencies[baseNote];
      if (baseFreq <= targetFreq && baseFreq > maxBaseFreq) {
        if (this.noteBuffers.has(baseNote)) {
          maxBaseFreq = baseFreq;
          bestBaseNote = baseNote;
        }
      }
    }

    const buffer = this.noteBuffers.get(bestBaseNote);

    if (buffer) {
      const source = this.audioContext.createBufferSource();
      source.buffer = buffer;

      // Pitch-Shift: Aceleramos o ralentizamos el audio MP3 para que coincida
      // perfectamente con la nota musical requerida a lo largo de todo el mástil.
      // pitchRatio = frecuenciaDestino / frecuenciaBase
      const baseFreq = this.noteFrequencies[bestBaseNote];
      const playbackRate = targetFreq / baseFreq;
      source.playbackRate.value = playbackRate;

      source.connect(this.audioContext.destination);
      source.start(0);
    }
  }

  startRecording(): void {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Aseguramos que el motor maestro esté activo
        if (this.audioContext.state === 'suspended') {
          this.audioContext.resume();
        }

        this.analyser = this.audioContext.createAnalyser();
        this.microphone = this.audioContext.createMediaStreamSource(stream);
        this.javascriptNode = this.audioContext.createScriptProcessor(2048, 1, 1);

        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.85;

        // Conectar los nodos
        this.microphone.connect(this.analyser);
        this.analyser.connect(this.javascriptNode);
        this.javascriptNode.connect(this.audioContext.destination);

        // Lógica matemática exacta de la Transformada de Fourier
        this.javascriptNode.onaudioprocess = () => {
          const buffer = new Float32Array(this.analyser.fftSize);
          this.analyser.getFloatTimeDomainData(buffer);

          // 0. DETECCIÓN DE ATAQUE Y VOLUMEN
          let rms = 0;
          for (let i = 0; i < buffer.length; i++) {
            rms += buffer[i] * buffer[i];
          }
          rms = Math.sqrt(rms / buffer.length);
          this.currentVolume.set(rms);

          // Detectar si hay un incremento brusco de volumen (Ataque)
          if (rms > 0.03 && rms > this.lastRms * this.attackThreshold) {
            this.isAttack.set(true);
            // El ataque es muy breve (aprox 1-2 frames)
            setTimeout(() => this.isAttack.set(false), 30); 
          }
          this.lastRms = rms;

          const dominantFrequency = this.autoCorrelate(buffer, this.audioContext.sampleRate, rms);

          if (dominantFrequency === -1 || dominantFrequency < 70 || dominantFrequency > 2000) {
            this.currentNote.set(null);
            this.tuningStatus.set(null);
            return;
          }

          // 1. SISTEMA DE AFINACIÓN (Precisión Cents)
          let tuningNote: string | null = null;
          let minDiff = Infinity;
          let exactFreq = 0;

          // Buscar la cuerda del ukelele más cercana a la frecuencia detectada
          for (const noteName of this.tuningStrings) {
            const freq = this.noteFrequencies[noteName];
            const diff = Math.abs(freq - dominantFrequency);
            if (diff < 35 && diff < minDiff) {
              minDiff = diff;
              tuningNote = noteName;
              exactFreq = freq;
            }
          }

          if (tuningNote) {
            // Calcular desviación en cents: 1200 * log2(f1 / f2)
            const cents = 1200 * Math.log2(dominantFrequency / exactFreq);

            // Dado que la medición es exacta, reducimos el margen de 'Perfecto' a +-10 cents
            let instruction = 'Perfecto';
            if (cents < -10) instruction = 'Tensar';
            else if (cents > 10) instruction = 'Aflojar';

            this.tuningStatus.set({ 
              note: tuningNote, 
              cents, 
              instruction, 
              freq: dominantFrequency 
            });
          } else {
            this.tuningStatus.set(null);
          }

          // 2. SISTEMA DE JUEGO (Detección dinámica)
          let foundNote: string | null = null;
          let minCentsDiff = Infinity;

          for (const [noteName, exactFreq] of Object.entries(this.noteFrequencies)) {
            const cents = Math.abs(1200 * Math.log2(dominantFrequency / exactFreq));
            // 45 cents es un rango muy generoso para el juego (casi medio tono)
            if (cents < 45 && cents < minCentsDiff) { 
              minCentsDiff = cents;
              foundNote = noteName;
            }
          }

          // Actualizamos la Signal con la nota detectada para el juego
          this.currentNote.set(foundNote);
        };

        this.audioStream = stream;
      })
      .catch(error => console.error('Error al acceder al micrófono: ', error));
  }

  stopRecording(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
    }
    if (this.microphone) this.microphone.disconnect();
    if (this.analyser) this.analyser.disconnect();
    if (this.javascriptNode) this.javascriptNode.disconnect();

    // IMPORTANTE: Ya no cerramos el audioContext aquí porque inhabilitaría
    // el modo Auto-Play y el metrónomo. Lo dejamos vivo en memoria.

    this.currentNote.set(null); // Limpiar la nota al detener
  }

  playMetronomeClick() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    // Ahora usa el contexto de audio principal en lugar de crear uno nuevo
    const osc = this.audioContext.createOscillator();
    const envelope = this.audioContext.createGain();

    // Ajustes para sonido menos agudo
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.05);

    envelope.gain.setValueAtTime(0.4, this.audioContext.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);

    osc.connect(envelope);
    envelope.connect(this.audioContext.destination);

    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
  }

  reproducirClickMetronomo() {
    // 1. Sonido
    this.playMetronomeClick();

    // 2. ✨ EFECTO VISUAL
    const panel = document.querySelector('.score-board') as HTMLElement;
    if (panel) {
      panel.style.transition = 'none';
      panel.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
      setTimeout(() => {
        panel.style.transition = 'box-shadow 0.2s';
        panel.style.boxShadow = 'none';
      }, 50);
    }
  }

  // --- ALGORITMO DE AUTOCORRELACIÓN PROFESIONAL ---
  private autoCorrelate(buf: Float32Array, sampleRate: number, rms: number): number {
    // 1. Filtrar silencio y ruidos bajos (Umbral más estricto para el juego)
    if (rms < 0.03) return -1; 

    // 2. Acotar el buffer a la señal útil (quitar ruido inicial)
    let r1 = 0, r2 = buf.length - 1, thres = 0.2;
    for (let i = 0; i < buf.length / 2; i++) {
      if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    }
    for (let i = 1; i < buf.length / 2; i++) {
      if (Math.abs(buf[buf.length - i]) < thres) { r2 = buf.length - i; break; }
    }

    buf = buf.subarray(r1, r2);
    const size = buf.length;
    const c = new Float32Array(size);

    // 3. Autocorrelación (compara la onda consigo misma deslizada en el tiempo)
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size - i; j++) {
        c[i] = c[i] + buf[j] * buf[j + i];
      }
    }

    // 4. Encontrar el primer pico significativo (fundamental)
    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < size; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;

    // 5. Interpolación Parabólica para precisión de milésimas de Hertz
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
  }
}