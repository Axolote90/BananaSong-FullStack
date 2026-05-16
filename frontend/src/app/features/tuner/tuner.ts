import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AudioService } from '../../core/services/audio';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faMusic } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-tuner',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './tuner.html',
  styleUrl: './tuner.css'
})
export class TunerComponent implements OnInit, OnDestroy {
  public audioService = inject(AudioService);
  private router = inject(Router);

  faArrowLeft = faArrowLeft;
  faMusic = faMusic;

  ngOnInit() {
    this.audioService.startRecording();
  }

  ngOnDestroy() {
    this.audioService.stopRecording();
  }

  backToMenu() {
    this.router.navigate(['/menu']);
  }
}
