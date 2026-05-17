import { Injectable, inject, signal, effect } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.config';
import { AuthService } from './auth';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private authService = inject(AuthService);
  
  // Lista de notificaciones flotantes activas
  public notifications = signal<any[]>([]);

  constructor() {
    this.connect();
    
    // Auto-identificarse al cambiar de usuario
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id && this.socket) {
        this.socket.emit('identify', user.id);
      }
    });
  }

  private connect() {
    // Conectar usando la misma base URL dinámica de Express
    this.socket = io(API_BASE_URL);

    this.socket.on('connect', () => {
      console.log('🔌 Conectado al servidor de WebSockets de Banana Song');
      const user = this.authService.currentUser();
      if (user && user.id) {
        this.socket.emit('identify', user.id);
      }
    });

    // 1. Escuchar récords superados generales (Comunidad)
    this.socket.on('record_beaten_broadcast', (data) => {
      const user = this.authService.currentUser();
      if (user && user.username === data.newTopUser) return; // Omitir si fui yo

      this.addNotification({
        type: 'community',
        title: '🏆 ¡Ascenso en el Ranking!',
        message: `¡${data.newTopUser} superó a ${data.formerTopUser} en el ranking de ${data.instrumentName} con ${data.xp} XP! 🎸`,
        icon: '🔥'
      });
    });

    // 2. Escuchar récords superados personales (Rivalidad directa)
    this.socket.on('record_beaten_personal', (data) => {
      this.addNotification({
        type: 'rivalry',
        title: '⚡ ¡Has sido Superado!',
        message: `¡Oh no! ${data.newTopUser} te acaba de superar en el ranking de ${data.instrumentName} con ${data.xp} XP. ¡Recupéralo! 💥`,
        icon: '🎸'
      });
    });
  }

  public on(event: string, callback: (...args: any[]) => void) {
    this.socket.on(event, callback);
  }

  private addNotification(notif: any) {
    const id = Date.now() + Math.random();
    const newNotif = { ...notif, id };
    
    this.notifications.update(prev => [...prev, newNotif]);

    // Desaparecer después de 6.5 segundos
    setTimeout(() => {
      this.removeNotification(id);
    }, 6500);
  }

  public removeNotification(id: number) {
    this.notifications.update(prev => prev.filter(n => n.id !== id));
  }
}
