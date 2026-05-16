import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:3000/api/progress';

  saveProgress(data: ProgressData): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
