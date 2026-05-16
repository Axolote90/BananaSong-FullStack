import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from '../config/api.config';

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
  private apiUrl = API_CONFIG.progress;

  saveProgress(data: ProgressData): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
