import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AulaService } from 'src/app/services/aula.service';
import { SolicitudApartadoService } from 'src/app/services/solicitud-apartado.service';
import { AlertController, LoadingController, NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';
import { Aula } from '../models/solicitud-apartado';
import { CreateSolicitudApartadoDto, DisponibilidadHora } from '../models/solicitud-apartado.dto';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { OfflineStorageService, PendingReserva } from '../services/offline-storage.service';
import { NetworkStatusService } from '../services/network-status.service';

@Component({
  selector: 'app-apartar',
  templateUrl: './apartar.page.html',
  styleUrls: ['./apartar.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, ReactiveFormsModule]
})
export class ApartarPage implements OnInit, OnDestroy {

   // Steps del wizard
  currentStep: number = 1;

  // Datos del formulario
  aulas: Aula[] = [];
  aulaSeleccionada: Aula | null = null;
  fechaSeleccionada: string = '';
  disponibilidad: DisponibilidadHora[] = [];
  horarioSeleccionado: DisponibilidadHora | null = null;
  motivo: string = '';

  // Estados
  loading: boolean = false;
  loadingDisponibilidad: boolean = false;
  isOnline: boolean = false;
  pendingReservas: PendingReserva[] = [];

  // Horarios fijos para offline
  private readonly HORARIOS_FIJOS: DisponibilidadHora[] = [
    { horaInicio: '07:30:00', horaFin: '08:30:00', disponible: true },
    { horaInicio: '08:30:00', horaFin: '09:30:00', disponible: true },
    { horaInicio: '09:30:00', horaFin: '10:30:00', disponible: true },
    { horaInicio: '10:30:00', horaFin: '11:30:00', disponible: true },
    { horaInicio: '11:30:00', horaFin: '12:30:00', disponible: true },
    { horaInicio: '12:30:00', horaFin: '13:30:00', disponible: true },
    { horaInicio: '13:30:00', horaFin: '14:30:00', disponible: true },
    { horaInicio: '14:30:00', horaFin: '15:00:00', disponible: true },
  ];

  // Usuario
  usuarioId: number = 0;

  private destroy$ = new Subject<void>();

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private aulaService: AulaService,
    private reservaService: SolicitudApartadoService,
    private authService: AuthService,
    private networkStatus: NetworkStatusService,
    private offlineStorage: OfflineStorageService
  ) {}

  ngOnInit(): void {
    this.loadAulas();
    this.setFechaMinima();

    // Obtener usuario ID
    this.usuarioId = this.authService.userId || 0;

    // Monitorear estado de la red
    this.networkStatus
      .getNetworkStatus()
      .pipe(takeUntil(this.destroy$))
      .subscribe((isOnline) => {
        this.isOnline = isOnline;
        if (isOnline) {
          this.checkPendingReservas();
        }
      });

    // Mostrar reservas pendientes
    this.loadPendingReservas();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFechaMinima(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    this.fechaSeleccionada = `${year}-${month}-${day}`;
  }

  async loadAulas(): Promise<void> {
    const loading = await this.loadingCtrl.create({
      message: 'Cargando aulas...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      this.aulas = await this.aulaService.getAulas();
      this.aulas = this.aulas.filter((aula) => aula.estatus);
    } catch (err: any) {
      await this.showToast('Error al cargar las aulas', 'danger');
      console.error('Error loading aulas:', err);
    } finally {
      await loading.dismiss();
    }
  }

  onSelectAula(aula: Aula): void {
    this.aulaSeleccionada = aula;
    this.disponibilidad = [];
    this.horarioSeleccionado = null;
    this.currentStep = 2;
  }

  async onFechaChange(): Promise<void> {
    if (!this.aulaSeleccionada || !this.fechaSeleccionada) return;

    const loading = await this.loadingCtrl.create({
      message: 'Cargando disponibilidad...',
      spinner: 'crescent',
    });
    await loading.present();

    this.disponibilidad = [];
    this.horarioSeleccionado = null;

    try {
      // Si estamos online, intenta obtener disponibilidad real del servidor
      if (this.isOnline) {
        this.disponibilidad =
          (await this.reservaService
            .getDisponibilidad(this.aulaSeleccionada.id, this.fechaSeleccionada)
            .toPromise()) ?? [];
      } else {
        // Si estamos offline, mostrar horarios fijos
        console.log('📱 Modo offline - Mostrando horarios fijos de 7:30 AM a 3:00 PM');
        this.disponibilidad = JSON.parse(JSON.stringify(this.HORARIOS_FIJOS));
      }
      this.currentStep = 3;
    } catch (err: any) {
      // Si hay error obteniendo disponibilidad y estamos online
      if (this.isOnline) {
        await this.showToast('Error al cargar la disponibilidad', 'danger');
        console.error('Error loading disponibilidad:', err);
      } else {
        // Si estamos offline, mostrar los horarios fijos
        console.log('📱 Error obteniendo disponibilidad, usando horarios fijos');
        this.disponibilidad = JSON.parse(JSON.stringify(this.HORARIOS_FIJOS));
        this.currentStep = 3;
      }
    } finally {
      await loading.dismiss();
    }
  }

  onSelectHorario(horario: DisponibilidadHora): void {
    if (!horario.disponible) return;
    this.horarioSeleccionado = horario;
    this.currentStep = 4;
  }

  async onConfirmarReserva(): Promise<void> {
    if (!this.isFormValid()) {
      await this.showToast('Por favor, completa todos los campos', 'warning');
      return;
    }

    if (this.usuarioId <= 0) {
      await this.showAlert(
        'Error de autenticación',
        'No se pudo obtener el ID del usuario. Por favor, inicia sesión nuevamente.'
      );
      this.authService.logout();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Creando reserva...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      const dto: CreateSolicitudApartadoDto = {
        fecha: this.fechaSeleccionada,
        horaInicio: this.horarioSeleccionado!.horaInicio,
        horaFin: this.horarioSeleccionado!.horaFin,
        motivo: this.motivo.trim(),
        usuarioId: this.usuarioId,
        aulaId: this.aulaSeleccionada!.id,
      };

      await this.reservaService.createSolicitud(dto);

      // Éxito
      if (this.isOnline) {
        await this.showSuccessAlert('¡Reserva creada exitosamente!');
        await this.authService.refreshUser();
      } else {
        await this.showSuccessAlert('Reserva guardada localmente. Se enviará cuando haya conexión.');
        this.loadPendingReservas();
      }

      // Redirigir a home
      this.resetForm();
      this.navCtrl.navigateRoot('/home');
    } catch (err: any) {
      if (err.message?.includes('OFFLINE')) {
        // Guardada offline correctamente
        await this.showSuccessAlert('Reserva guardada localmente. Se enviará cuando haya conexión.');
        this.loadPendingReservas();
        this.resetForm();
        this.navCtrl.navigateRoot('/home');
      } else if (err.statusCode === 409 || err.status === 409) {
        // Error de conflicto de horario
        await this.showAlert('Conflicto de horario', err.message);
      } else if (err.message) {
        // Cualquier otro error con mensaje
        await this.showAlert('Error', err.message);
      } else {
        // Error genérico
        await this.showAlert('Error', 'Error al crear la reserva. Por favor, intenta nuevamente.');
      }
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Carga las reservas pendientes de sincronizar
   */
  loadPendingReservas(): void {
    this.pendingReservas = this.offlineStorage.getPendingReservas();
  }

  /**
   * Verifica si hay reservas pendientes cuando regresa la conexión
   */
  async checkPendingReservas(): Promise<void> {
    this.loadPendingReservas();
    if (this.pendingReservas.length > 0) {
      console.log(`🔄 Hay ${this.pendingReservas.length} reserva(s) pendiente(s) de sincronizar`);
      await this.showToast(
        `${this.pendingReservas.length} reserva(s) pendiente(s) se sincronizarán automáticamente...`,
        'primary'
      );
    }
  }

  /**
   * Reintentar una reserva específica
   */
  async retryReserva(reserva: PendingReserva): Promise<void> {
    if (!this.isOnline) {
      await this.showToast('No hay conexión a internet', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Sincronizando reserva...',
      spinner: 'crescent',
    });
    await loading.present();

    try {
      this.offlineStorage.updateReservaStatus(reserva.id, 'syncing');

      const dto: CreateSolicitudApartadoDto = {
        fecha: reserva.fecha,
        horaInicio: reserva.horaInicio,
        horaFin: reserva.horaFin,
        motivo: reserva.motivo,
        usuarioId: reserva.usuarioId,
        aulaId: reserva.aulaId,
      };

      await this.reservaService.createSolicitud(dto);

      this.offlineStorage.updateReservaStatus(reserva.id, 'synced');
      this.loadPendingReservas();
      await this.showToast('Reserva sincronizada exitosamente', 'success');
    } catch (err: any) {
      const errorMsg = err.error?.message || err.message || 'Error al sincronizar';
      this.offlineStorage.updateReservaStatus(reserva.id, 'error', errorMsg);
      await this.showToast(errorMsg, 'danger');
    } finally {
      await loading.dismiss();
    }
  }

  /**
   * Elimina una reserva pendiente
   */
  async deletePendingReserva(reservaId: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de que deseas eliminar esta reserva?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.offlineStorage.removePendingReserva(reservaId);
            this.loadPendingReservas();
            this.showToast('Reserva eliminada', 'success');
          },
        },
      ],
    });

    await alert.present();
  }

  isFormValid(): boolean {
    return !!(
      this.aulaSeleccionada &&
      this.fechaSeleccionada &&
      this.horarioSeleccionado &&
      this.motivo.trim().length > 0
    );
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
  }

  async onBack(): Promise<void> {
    if (this.currentStep > 1) {
      this.currentStep--;
      if (this.currentStep === 1) {
        this.resetForm();
      } else if (this.currentStep === 2) {
        this.disponibilidad = [];
        this.horarioSeleccionado = null;
        this.motivo = '';
      } else if (this.currentStep === 3) {
        this.horarioSeleccionado = null;
        this.motivo = '';
      }
    } else {
      this.navCtrl.back();
    }
  }

  private resetForm(): void {
    this.aulaSeleccionada = null;
    this.disponibilidad = [];
    this.horarioSeleccionado = null;
    this.motivo = '';
    this.currentStep = 1;
  }

  // Utilidades para mostrar mensajes
  private async showToast(message: string, color: string = 'dark'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  private async showAlert(header: string, message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private async showSuccessAlert(message: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '✅ Éxito',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}