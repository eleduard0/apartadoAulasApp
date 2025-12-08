import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavController, ToastController, IonicModule } from '@ionic/angular';
import { ReservaHistorial } from '../models/reserva-historial'; 
import { SolicitudApartadoService } from '../services/solicitud-apartado.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-historial',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
  standalone: true,
  imports: [
    CommonModule,    // ⚠️ Para *ngFor, *ngIf, pipes
    FormsModule,     // ⚠️ Para [(ngModel)]
    IonicModule      // ⚠️ Para componentes Ionic
  ]
})
export class HistorialPage implements OnInit {
  reservas: ReservaHistorial[] = [];
  loading: boolean = false;
  error: string = '';

  // Filtros
  filtroEstado: string = '';
  estados: string[] = ['Confirmada', 'Cancelada', 'Completada', 'Pendiente'];

  usuarioId: number = 0;

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private reservaService: SolicitudApartadoService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.usuarioId = this.authService.userId || 0;
    if (this.usuarioId > 0) {
      this.loadHistorial();
    } else {
      this.error = 'No hay usuario logueado';
      this.showToast('No hay usuario logueado', 'danger');
      this.authService.logout();
    }
  }

  async loadHistorial(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      this.reservas = await this.reservaService.getHistorialReservas(
        this.usuarioId
      );
      console.log('Historial cargado:', this.reservas);
    } catch (err: any) {
      this.error =
        'Error al cargar el historial. Por favor, intenta nuevamente.';
      console.error('Error loading historial:', err);
      await this.showToast('Error al cargar el historial', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Aplica los filtros seleccionados
   */
  aplicarFiltros(): void {
    // Este método se llama cuando cambia el select
    // El getter reservasFiltradas ya maneja la lógica
  }

  /**
   * Obtiene las reservas filtradas por estado (si se selecciona uno)
   */
  get reservasFiltradas(): ReservaHistorial[] {
    if (!this.filtroEstado) {
      return this.reservas;
    }
    return this.reservas.filter((r) => r.estado === this.filtroEstado);
  }

  /**
   * Formatea la fecha a formato legible
   */
  formatDate(fecha: string): string {
    try {
      // Si viene con timestamp (ISO format), extraer solo la fecha
      if (fecha.includes('T')) {
        fecha = fecha.split('T')[0];
      }

      const date = new Date(fecha + 'T00:00:00');
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return fecha; // Si hay error, devolver la fecha original
    }
  }

  /**
   * Obtiene el nombre del día de la semana
   */
  getDayName(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
    // Capitalizar la primera letra
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
  }

  /**
   * Formatea la hora
   */
  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  /**
   * Obtiene la clase CSS según el estado
   */
  getStatusClass(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'status-confirmada';
      case 'cancelada':
        return 'status-cancelada';
      case 'completada':
        return 'status-completada';
      case 'pendiente':
        return 'status-pendiente';
      default:
        return 'status-default';
    }
  }

  /**
   * Obtiene el color de Ionic según el estado
   */
  getStatusColor(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return 'success';
      case 'cancelada':
        return 'danger';
      case 'completada':
        return 'primary';
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  }

  /**
   * Obtiene el color del icono según el estado
   */
  getStatusIcon(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'confirmada':
        return '✅';
      case 'cancelada':
        return '❌';
      case 'completada':
        return '✔️';
      case 'pendiente':
        return '⏳';
      default:
        return '📋';
    }
  }

  /**
   * Volver atrás
   */
  onBack(): void {
    this.navCtrl.navigateRoot('/home');
  }

  /**
   * Limpiar filtro
   */
  clearFilter(): void {
    this.filtroEstado = '';
  }

  /**
   * Retornar el total de reservas filtradas
   */
  get totalReservas(): number {
    return this.reservasFiltradas.length;
  }

  /**
   * Muestra un toast con un mensaje
   */
  private async showToast(message: string, color: string = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  /**
   * Método del ciclo de vida ionViewWillEnter
   * Se ejecuta cada vez que la vista está a punto de entrar
   */
  ionViewWillEnter(): void {
    // Recargar el historial cada vez que se entra a la página
    if (this.usuarioId > 0) {
      this.loadHistorial();
    }
  }
}