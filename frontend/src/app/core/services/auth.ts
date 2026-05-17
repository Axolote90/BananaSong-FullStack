import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from '../models/user';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  
  /* 
    MODO NGROK: La URL se gestiona automáticamente desde api.config.ts
    Para volver a local, edita src/app/core/config/api.config.ts
  */
  private apiUrl = API_CONFIG.auth;
  private usersUrl = API_CONFIG.users;

  // 1. Creamos una señal para el usuario. 
  // Intentamos leer del localStorage para que no se borre al refrescar.
  currentUser = signal<any>(JSON.parse(localStorage.getItem('bananasong_user') || 'null'));

  login(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        // 2. Al recibir respuesta, guardamos en la señal y en localStorage
        if (res.user && res.token) {
          const sessionData = { ...res.user, token: res.token };
          this.setSession(sessionData);
        }
      })
    );
  }

  register(credentials: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials).pipe(
      tap(res => {
        if (res.user && res.token) {
          const sessionData = { ...res.user, token: res.token };
          this.setSession(sessionData);
        }
      })
    );
  }

  private setSession(user: any) {
    localStorage.setItem('bananasong_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('bananasong_user');
    this.currentUser.set(null);
  }

  updateOnboarding(data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/onboarding`, data).pipe(
      tap((res: any) => {
        const updatedUser = { ...this.currentUser(), ...res.user };
        this.setSession(updatedUser);
      })
    );
  }

  updateProfile(data: any): Observable<any> {
    const token = this.currentUser()?.token;
    return this.http.put(`${this.usersUrl}/profile`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      tap((res: any) => {
        if (res.user) {
          const updatedUser = { ...this.currentUser(), ...res.user };
          this.setSession(updatedUser);
        }
      })
    );
  }

  getLeaderboard(limit: number = 10, instrument?: string): Observable<any[]> {
    let url = `${this.usersUrl}/leaderboard?limit=${limit}`;
    if (instrument) url += `&instrument=${instrument}`;
    return this.http.get<any[]>(url);
  }

  getProfile(): Observable<any> {
    const token = this.currentUser()?.token;
    return this.http.get<any>(`${this.apiUrl}/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      tap((res: any) => {
        if (res.user) {
          const updatedUser = { ...this.currentUser(), ...res.user };
          this.setSession(updatedUser);
        }
      })
    );
  }

  enrollInstrument(instrument: string): Observable<any> {
    const token = this.currentUser()?.token;
    return this.http.post<any>(`${this.usersUrl}/enroll-instrument`, { instrument }, {
      headers: { 'Authorization': `Bearer ${token}` }
    }).pipe(
      tap((res: any) => {
        if (res.user) {
          const updatedUser = { ...this.currentUser(), ...res.user };
          this.setSession(updatedUser);
        }
      })
    );
  }
}