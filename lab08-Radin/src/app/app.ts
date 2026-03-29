import { Component } from '@angular/core';
import { Heroes } from './heroes/heroes';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Heroes],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
}