export interface Level {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bpm: number;
  track_data?: any; // Lo dejamos opcional por ahora
}