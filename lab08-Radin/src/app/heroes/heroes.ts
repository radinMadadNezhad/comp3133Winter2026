import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Hero } from '../hero';
import { HEROES } from '../mock-heroes';
import { RemoveSpacesPipe } from '../remove-spaces-pipe';
import { InputFormatDirective } from '../input-format';
@Component({
  selector: 'app-heroes',
  standalone: true,
  imports: [CommonModule, FormsModule, RemoveSpacesPipe, InputFormatDirective],
  templateUrl: './heroes.html',
  styleUrl: './heroes.css'
})
export class Heroes {
  heroes = HEROES;
  selectedHero?: Hero;

  onSelect(hero: Hero): void {
    this.selectedHero = hero;
  }
}