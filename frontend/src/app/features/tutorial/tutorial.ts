import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from '../game/game';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule, GameComponent],
  template: `
    <app-game forceMode="tutorial"></app-game>
  `
})
export class TutorialComponent {}
