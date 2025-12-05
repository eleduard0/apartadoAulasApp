import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AulaService } from 'src/app/services/aula.service';
import { SolicitudApartadoService } from 'src/app/services/solicitud-apartado.service';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-apartar',
  templateUrl: './apartar.page.html',
  styleUrls: ['./apartar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class ApartarPage implements OnInit {

  reservaForm!: FormGroup;
  aulas: any[] = [];
  usuarioId!: number;

  constructor(
    private fb: FormBuilder,
    private aulaService: AulaService,
    private solicitudService: SolicitudApartadoService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private authService: AuthService
  ) {}

  ngOnInit() {

    // ✔ Tomamos el usuario desde el servicio de autenticación
    const user = this.authService.getUser();
    if (user) {
      this.usuarioId = user.idUsuario;
    }

    this.reservaForm = this.fb.group({
      aulaId: ['', Validators.required],
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      motivo: ['', [Validators.required, Validators.minLength(5)]],
    });

    this.cargarAulas();
  }

  cargarAulas() {
    this.aulaService.getAulas().subscribe(aulas => {
      this.aulas = aulas;
    });
  }

  async crearReserva() {
    if (this.reservaForm.invalid) return;

    const loading = await this.loadingCtrl.create({ message: 'Creando reserva...' });
    await loading.present();

    const form = this.reservaForm.value;

    const dto = {
      aulaId: form.aulaId,
      fecha: form.fecha.split('T')[0],                    // '2025-12-04'
      horaInicio: form.horaInicio.substring(11, 16),      // '08:30'
      horaFin: form.horaFin.substring(11, 16),            // '10:00'
      motivo: form.motivo,
      usuarioId: this.usuarioId                           // ✔ ya tomado del login
    };

    this.solicitudService.crearSolicitud(dto).subscribe({
      next: async () => {
        await loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Reserva creada',
          message: 'Tu reserva fue creada correctamente.',
          buttons: ['OK']
        });
        await alert.present();
      },
      error: async (err) => {
        await loading.dismiss();

        let msg = 'Ocurrió un error.';

        if (err.status === 409) {
          msg = 'Ya existe una reserva en ese horario.';
        }

        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: msg,
          buttons: ['OK']
        });
        await alert.present();
      }
    });

  }

}
