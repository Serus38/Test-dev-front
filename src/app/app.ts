import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './componets/navbar/navbar';

@Component({
  selector: 'app-root',
  imports: [Navbar, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
// Contenedor raiz: renderiza layout principal y el router outlet.
export class App {}
