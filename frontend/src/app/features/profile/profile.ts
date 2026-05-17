import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faUserEdit, faTrophy, faSignOutAlt, faCamera } from '@fortawesome/free-solid-svg-icons';
import { ImageCropperComponent } from 'ngx-image-cropper';
import { SocketService } from '../../core/services/socket';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, ImageCropperComponent],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);
  private socketService = inject(SocketService);

  faArrowLeft = faArrowLeft;
  faUserEdit = faUserEdit;
  faTrophy = faTrophy;
  faSignOutAlt = faSignOutAlt;
  faCamera = faCamera;

  user = this.authService.currentUser;
  leaderboard = signal<any[]>([]);
  selectedLeaderboardInstrument = signal<string>('ukulele');
  
  instruments = [
    { id: 'ukulele', name: 'Ukelele', icon: '🎸' },
    { id: 'guitar_acoustic', name: 'Acústica', icon: '🎵' },
    { id: 'guitar_electric', name: 'Eléctrica', icon: '⚡' },
    { id: 'violin', name: 'Violín', icon: '🎻' },
    { id: 'flute', name: 'Flauta Dulce', icon: '💨' },
    { id: 'piano', name: 'Piano', icon: '🎹' }
  ];
  
  // Imagen y Recorte
  imageChangedEvent: any = '';
  croppedImage: any = '';
  showCropper = signal(false);

  // Modelos para edición
  editMode = signal(false);
  editData = {
    username: '',
    bio: ''
  };

  badgeDefinitions: any = {
    'novice': { name: 'Novato', icon: '🥉', description: '500 XP alcanzados' },
    'apprentice': { name: 'Aprendiz', icon: '🥈', description: '1500 XP alcanzados' },
    'specialist': { name: 'Especialista', icon: '🥇', description: '4000 XP alcanzados' },
    'master': { name: 'Maestro', icon: '👑', description: '¡10000 XP! Eres una leyenda' }
  };

  ngOnInit() {
    this.loadLeaderboard();
    
    // Escuchar actualizaciones de Leaderboard en tiempo real vía WebSockets
    this.socketService.on('leaderboard_update', (data) => {
      if (data && data.instrument === this.selectedLeaderboardInstrument()) {
        this.loadLeaderboard();
      }
    });

    this.authService.getProfile().subscribe({
      next: () => {
        if (this.user()) {
          this.editData.username = this.user().username;
          this.editData.bio = this.user().bio || '';
        }
      }
    });
    if (this.user()) {
      this.editData.username = this.user().username;
      this.editData.bio = this.user().bio || '';
    }
  }

  loadLeaderboard() {
    this.authService.getLeaderboard(5, this.selectedLeaderboardInstrument()).subscribe(data => {
      this.leaderboard.set(data);
    });
  }

  changeLeaderboardInstrument(instr: string) {
    this.selectedLeaderboardInstrument.set(instr);
    this.loadLeaderboard();
  }

  getInstrumentStatsArray() {
    const stats = this.user()?.instrumentStats;
    if (!stats) return [];
    return Object.keys(stats).map(key => ({
      id: key,
      name: this.instruments.find(i => i.id === key)?.name || key,
      icon: this.instruments.find(i => i.id === key)?.icon || '🎵',
      xp: stats[key].xp,
      level: stats[key].level,
      badges: (stats[key].badges || []).map((bId: string) => this.badgeDefinitions[bId]).filter((b: any) => !!b)
    }));
  }

  toggleEdit() {
    this.editMode.set(!this.editMode());
  }

  saveProfile() {
    const payload: any = { ...this.editData };
    if (this.croppedImage) {
      payload.profile = this.croppedImage; // Base64 de la imagen recortada
    }

    this.authService.updateProfile(payload).subscribe({
      next: () => {
        this.editMode.set(false);
        this.showCropper.set(false);
        this.croppedImage = '';
        this.loadLeaderboard();
      },
      error: (err) => console.error("Error al guardar perfil", err)
    });
  }

  // --- MÉTODOS DEL CROPPER ---
  fileChangeEvent(event: any): void {
    this.imageChangedEvent = event;
    this.showCropper.set(true);
  }

  imageCropped(event: any) {
    if (event.base64) {
      this.croppedImage = event.base64;
    } else if (event.blob) {
      // Si la librería entrega un blob, lo convertimos a base64 manualmente
      const reader = new FileReader();
      reader.onloadend = () => {
        this.croppedImage = reader.result as string;
      };
      reader.readAsDataURL(event.blob);
    }
  }

  // Al confirmar el recorte, comprimimos y enviamos automáticamente
  confirmarRecorte() {
    if (!this.croppedImage) {
      console.error('No hay imagen válida para subir');
      return;
    }

    // Validar que no sea una URL temporal blob:
    if (this.croppedImage.startsWith('blob:')) {
      console.error('Error: Se intentó subir una URL temporal en lugar de datos reales.');
      return;
    }

    this.authService.updateProfile({ 
      profile: this.croppedImage 
    }).subscribe({
      next: (res) => {
        console.log('Respuesta del servidor:', res);
        this.showCropper.set(false);
        this.imageChangedEvent = '';
        this.croppedImage = ''; // Limpiar para que use la del perfil actualizado
      },
      error: (err) => {
        console.error("Error al subir foto:", err);
        alert("Error al subir la foto. Posiblemente el archivo es demasiado grande o hubo un fallo de conexión.");
      }
    });
  }

  private base64ToBlob(base64: string): Blob {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  getSafeProfileUrl(url: any): string {
    if (!url || typeof url !== 'string' || url.startsWith('blob:')) {
      return 'assets/img/banana.jpg';
    }
    return url;
  }


  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  backToMenu() {
    this.router.navigate(['/menu']);
  }
}
