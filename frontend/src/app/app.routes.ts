import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth';
import { GameMenuComponent } from './features/game-menu/game-menu';
import { GameComponent } from './features/game/game';
import { TunerComponent } from './features/tuner/tuner';
import { ProfileComponent } from './features/profile/profile';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'menu', component: GameMenuComponent },
  { path: 'game/:id', component: GameComponent },
  { path: 'tuner', component: TunerComponent },
  { path: 'profile', component: ProfileComponent }
];