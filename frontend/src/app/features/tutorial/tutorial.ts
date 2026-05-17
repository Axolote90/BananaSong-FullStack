import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameComponent } from '../game/game';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [CommonModule, GameComponent],
  template: `
    <app-game forceMode="tutorial" [forcedInstrument]="forcedInstrument"></app-game>
  `
})
export class TutorialComponent {
  private route = inject(ActivatedRoute);

  get forcedInstrument(): string | null {
    return this.route.snapshot.queryParamMap.get('instrument');
  }
}
