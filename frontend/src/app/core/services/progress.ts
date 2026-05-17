import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';
import { AuthService } from './auth';
import { tap } from 'rxjs/operators';

export interface ProgressData {
  levelId: number;
  score: number;
  stars: number;
  maxCombo: number;
  accuracy: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = API_CONFIG.progress;

  saveProgress(data: ProgressData): Observable<any> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      tap(res => {
        if (res.userStats) {
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            this.authService.currentUser.set({
              ...currentUser,
              ...res.userStats
            });
            localStorage.setItem('bananasong_user', JSON.stringify(this.authService.currentUser()));
          }
        }
      })
    );
  }
}
