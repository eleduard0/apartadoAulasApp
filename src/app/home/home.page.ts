import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class HomePage implements OnInit, OnDestroy {
  userName: string = '';
  totalReservas: number = 0;
  reservasActivas: number = 0;
  proximasReservas: any[] = [];
  loading: boolean = true;
  
  private destroy$ = new Subject<void>();

  constructor(
    private navCtrl: NavController,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Suscribirse para recibir actualizaciones automáticas del usuario
    this.authService.currentUser
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!user) {
          this.navCtrl.navigateRoot('/login');
          return;
        }

        // Asignar los valores que vienen actualizados desde refreshUser()
        this.userName = user.nombre;
        this.totalReservas = user.totalReservas;
        this.reservasActivas = user.totalActivasHoy;
        this.proximasReservas = user.proximasReservas || [];
        this.loading = false;

        console.log('Home actualizado con:', user);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Se ejecuta cada vez que la vista está a punto de entrar
   */
  ionViewWillEnter(): void {
    // Recargar datos del usuario
    this.authService.refreshUser();
  }

  /**
   * Navegar a nueva reserva
   */
  onNuevaReserva(): void {
    this.navCtrl.navigateForward('/apartar');
  }

  /**
   * Navegar a historial
   */
  onHistorial(): void {
    this.navCtrl.navigateForward('/historial');
  }

  /**
   * Navegar a perfil
   */
  onPerfil(): void {
    this.navCtrl.navigateForward('/perfil');
    // TODO: Navegar a la página de perfil
    // this.navCtrl.navigateForward('/perfil');
  }

  /**
   * Cerrar sesión
   */
  onLogout(): void {
    this.authService.logout();
  }

  // --- Funciones de Formato para Próximas Reservas ---

  /**
   * Obtiene el nombre corto del día de la semana (ej: Mar, Jue).
   * @param dateOnlyString String de la propiedad Fecha (ej: "2025-11-11").
   * @returns Nombre corto del día.
   */
  getDayName(dateOnlyString: string): string {
    // Usamos el constructor Date con el string 'YYYY-MM-DD'
    const date = new Date(dateOnlyString + 'T00:00:00');
    return date
      .toLocaleDateString('es-MX', {
        weekday: 'short', // 'short' para "Mar."
      })
      .replace('.', ''); // Eliminar el punto (ej: "Mar")
  }

  /**
   * Formatea la fecha para mostrar el día y mes (ej: 11 Nov).
   * @param dateOnlyString String de la propiedad Fecha (ej: "2025-11-11").
   * @returns Fecha formateada (ej: 11 Nov).
   */
  formatDate(dateOnlyString: string): string {
    // Usamos el constructor Date con el string 'YYYY-MM-DD'
    const date = new Date(dateOnlyString + 'T00:00:00');
    return date.toLocaleDateString('es-MX', {
      day: 'numeric', // Mostrar el día del mes (11, 13)
      month: 'short', // Mostrar el mes abreviado (Nov)
    });
  }

  /**
   * Formatea la hora para coincidir con el diseño (solo HH:MM en 24h).
   * @param timeString String de la propiedad HoraInicio o HoraFin (ej: "10:00:00").
   * @returns Hora formateada (ej: 10:00).
   */
  formatTime(timeString: string): string {
    // La TimeOnly de C# generalmente viene como "HH:MM:SS" o "HH:MM".
    // Tomamos los primeros 5 caracteres para obtener "HH:MM" (formato 24h)
    return timeString.substring(0, 5);
  }

  /**
   * Obtiene la clase CSS según el estado de la reserva.
   * @param estado Estado de la reserva (ej: "Confirmada", "Pendiente").
   * @returns Clase CSS para el estilo de la etiqueta.
   */
  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'status-confirmada';
      case 'pendiente':
        return 'status-pendiente';
      default:
        return 'status-default';
    }
  }
}