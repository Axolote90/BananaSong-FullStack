import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './core/services/socket';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  public socketService = inject(SocketService);
}
