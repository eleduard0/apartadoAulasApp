import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, NavController, AlertController, ToastController, LoadingController } from '@ionic/angular';
import { Usuario, UserStats } from '../models/perfil.interfaces';
import { UsuarioService } from '../services/usuario.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule
  ]
})
export class PerfilPage implements OnInit {
  usuario: Usuario | null = null;
  loading = false;
  
  stats: UserStats = {
    totalReservas: 0,
    reservasActivas: 0
  };

  constructor(
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private usuarioService: UsuarioService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  ionViewWillEnter() {
    this.loadUserProfile();
  }

  /**
   * Carga el perfil del usuario actual
   */
  async loadUserProfile() {
    const userId = this.authService.userId;
    
    if (!userId) {
      this.navCtrl.navigateRoot('/login');
      return;
    }

    this.loading = true;

    try {
      // Obtener usuario
      this.usuario = await this.usuarioService.getUserById(userId);
      
      // Obtener estadísticas
      const currentUser = this.authService.currentUserValue;
      if (currentUser) {
        this.stats = {
          totalReservas: currentUser.totalReservas,
          reservasActivas: currentUser.totalActivasHoy
        };
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      await this.showToast('Error al cargar el perfil', 'danger');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Obtiene las iniciales del usuario
   */
  getInitials(): string {
    if (!this.usuario) return '';
    
    const firstInitial = this.usuario.nombre.charAt(0).toUpperCase();
    const lastInitial = this.usuario.apellido.charAt(0).toUpperCase();
    
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Formatea la fecha de registro
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtiene el color del chip según el rol
   */
  getRolColor(rolClave: string): string {
    const colorMap: { [key: string]: string } = {
      'ADMIN': 'danger',
      'SMC': 'warning',
      'STUDENT': 'primary',
      'TEACHER': 'success'
    };
    return colorMap[rolClave] || 'medium';
  }

  /**
   * Obtiene el icono según el rol
   */
  getRolIcon(rolClave: string): string {
    const iconMap: { [key: string]: string } = {
      'ADMIN': 'shield-checkmark',
      'SMC': 'key',
      'STUDENT': 'school',
      'TEACHER': 'person'
    };
    return iconMap[rolClave] || 'person-circle';
  }

  /**
   * Abre el alert para editar perfil
   */
  async openEditProfile() {
    if (!this.usuario) return;

    const alert = await this.alertCtrl.create({
      header: 'Editar Perfil',
      message: 'Actualiza tu información personal',
      inputs: [
        {
          name: 'nombre',
          type: 'text',
          placeholder: 'Nombre',
          value: this.usuario.nombre,
          attributes: {
            maxlength: 100
          }
        },
        {
          name: 'apellido',
          type: 'text',
          placeholder: 'Apellido',
          value: this.usuario.apellido,
          attributes: {
            maxlength: 100
          }
        },
        {
          name: 'email',
          type: 'email',
          placeholder: 'Email',
          value: this.usuario.email,
          attributes: {
            maxlength: 150
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: async (data) => {
            // Validaciones básicas
            if (!data.nombre || !data.apellido || !data.email) {
              await this.showToast('Todos los campos son requeridos', 'warning');
              return false;
            }

            if (!this.isValidEmail(data.email)) {
              await this.showToast('Email inválido', 'warning');
              return false;
            }

            await this.updateProfile(data);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Actualiza el perfil del usuario
   */
  async updateProfile(data: any) {
    if (!this.usuario) return;

    const loading = await this.loadingCtrl.create({
      message: 'Actualizando perfil...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const updateDto = {
        id: this.usuario.id,
        nombre: data.nombre.trim(),
        apellido: data.apellido.trim(),
        email: data.email.trim(),
        password: this.usuario.password || '', // Mantener la misma
        confirmPassword: this.usuario.password || '',
        estatus: this.usuario.estatus,
        rolId: this.usuario.rolId
      };

      await this.usuarioService.updateUser(updateDto);
      await loading.dismiss();
      
      await this.showToast('Perfil actualizado exitosamente', 'success');
      await this.loadUserProfile();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al actualizar perfil:', error);
      
      let message = 'Error al actualizar el perfil';
      if (error.error?.message) {
        message = error.error.message;
      }
      
      await this.showToast(message, 'danger');
    }
  }

  /**
   * Abre el alert para cambiar contraseña
   */
  async openChangePassword() {
    if (!this.usuario) return;

    const alert = await this.alertCtrl.create({
      header: 'Cambiar Contraseña',
      message: 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula y un número',
      inputs: [
        {
          name: 'currentPassword',
          type: 'password',
          placeholder: 'Contraseña actual',
          attributes: {
            autocomplete: 'current-password'
          }
        },
        {
          name: 'newPassword',
          type: 'password',
          placeholder: 'Nueva contraseña (mín. 8 caracteres)',
          attributes: {
            minlength: 8,
            autocomplete: 'new-password'
          }
        },
        {
          name: 'confirmNewPassword',
          type: 'password',
          placeholder: 'Confirmar nueva contraseña',
          attributes: {
            minlength: 8,
            autocomplete: 'new-password'
          }
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cambiar',
          handler: async (data) => {
            // Validaciones
            if (!data.currentPassword || !data.newPassword || !data.confirmNewPassword) {
              await this.showToast('Todos los campos son requeridos', 'warning');
              return false;
            }

            if (data.newPassword.length < 8) {
              await this.showToast('La nueva contraseña debe tener al menos 8 caracteres', 'warning');
              return false;
            }

            if (!this.isValidPassword(data.newPassword)) {
              await this.showToast('La contraseña debe contener mayúsculas, minúsculas y números', 'warning');
              return false;
            }

            if (data.newPassword !== data.confirmNewPassword) {
              await this.showToast('Las contraseñas no coinciden', 'warning');
              return false;
            }

            await this.changePassword(data);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Cambia la contraseña del usuario
   */
  async changePassword(data: any) {
    if (!this.usuario) return;

    const loading = await this.loadingCtrl.create({
      message: 'Cambiando contraseña...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const changePasswordDto = {
        usuarioId: this.usuario.id,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword
      };

      await this.usuarioService.changePassword(changePasswordDto);
      await loading.dismiss();
      
      await this.showToast('Contraseña actualizada exitosamente', 'success');
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al cambiar contraseña:', error);
      
      let message = 'Error al cambiar la contraseña';
      if (error.status === 400) {
        message = error.error?.message || 'La contraseña actual es incorrecta';
      } else if (error.error?.message) {
        message = error.error.message;
      }
      
      await this.showToast(message, 'danger');
    }
  }

  /**
   * Cierra sesión
   */
  async logout() {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar sesión',
          role: 'destructive',
          handler: () => {
            this.authService.logout();
          }
        }
      ]
    });

    await alert.present();
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de contraseña
   */
  private isValidPassword(password: string): boolean {
    // Debe tener al menos una mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/;
    return passwordRegex.test(password);
  }

  /**
   * Muestra un toast con un mensaje
   */
  private async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
   onBack(): void {
    this.navCtrl.navigateRoot('/home');
  }
}