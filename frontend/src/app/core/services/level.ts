import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Level } from '../models/level';
import { API_CONFIG } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  // Inyección del cliente HTTP
  private http = inject(HttpClient);
  
  // La URL de tu API gestionada centralmente
  private apiUrl = API_CONFIG.levels;

  // Función para pedir todas las canciones
  getLevels(instrument?: string): Observable<Level[]> {
    let url = this.apiUrl;
    if (instrument) {
      url += `?instrument=${instrument}`;
    }
    return this.http.get<Level[]>(url);
  }
  // Pedir una sola canción con su partitura (track_data)
  getLevelById(id: number): Observable<Level> {
    return this.http.get<Level>(`${this.apiUrl}/${id}`);
  }
}