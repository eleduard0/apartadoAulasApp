import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, RouterLink]
})
export class HomePage implements OnInit {

  nombre: string = "";
  totalReservas: number = 0;
  totalActivasHoy: number = 0;
  proximas: any[] = [];

  constructor(private auth: AuthService) {}

  ngOnInit() {
    const user = this.auth.getUser();

    if (user) {
      this.nombre = user.nombre;
      this.totalReservas = user.totalReservas;
      this.totalActivasHoy = user.totalActivasHoy;
      this.proximas = user.proximasReservas || [];
    }
  }

}
