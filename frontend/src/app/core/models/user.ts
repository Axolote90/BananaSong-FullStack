// src/app/core/models/user.ts
export interface User {
  id: number;
  username: string;
  xp: number;
  imgProfile: Blob;
  streak?: number;
  hearts?: number;
}

export interface AuthResponse {
  message: string;
  user?: User; // Opcional porque el registro a veces no devuelve el usuario completo
  userId?: number;
  token?: string;
}