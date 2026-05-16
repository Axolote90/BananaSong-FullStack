import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Level } from '../models/level';

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  // Inyección del cliente HTTP
  private http = inject(HttpClient);
  
  // La URL de tu API en Node.js
  private apiUrl = 'http://localhost:3000/api/levels';

  // Función para pedir todas las canciones
  getLevels(): Observable<Level[]> {
    return this.http.get<Level[]>(this.apiUrl);
  }
  // Pedir una sola canción con su partitura (track_data)
  getLevelById(id: number): Observable<Level> {
    return this.http.get<Level>(`${this.apiUrl}/${id}`);
  }
}