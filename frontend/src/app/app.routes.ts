import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth';
import { GameMenuComponent } from './features/game-menu/game-menu';
import { GameComponent } from './features/game/game';
import { TunerComponent } from './features/tuner/tuner';
import { ProfileComponent } from './features/profile/profile';
import { OnboardingComponent } from './features/onboarding/onboarding';
import { TutorialComponent } from './features/tutorial/tutorial';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: AuthComponent },
  { path: 'onboarding', component: OnboardingComponent },
  { path: 'tutorial', component: TutorialComponent },
  { path: 'menu', component: GameMenuComponent },
  { path: 'game/:id', component: GameComponent },
  { path: 'tuner', component: TunerComponent },
  { path: 'profile', component: ProfileComponent }
];