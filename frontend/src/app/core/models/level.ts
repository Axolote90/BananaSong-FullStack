export interface Level {
  id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  bpm: number;
  instrument?: string; // Nuevo campo para multi-instrumento
  track_data?: any;
}