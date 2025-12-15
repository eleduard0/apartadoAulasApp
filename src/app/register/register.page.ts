import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,RouterLink
  ]
})
export class RegisterPage implements OnInit {

  loading = false;
  showPassword = false;
  showConfirmPassword = false;

  // Validadores de requisitos de contraseña
  hasMinLength = false;
  hasUppercase = false;
  hasLowercase = false;
  hasNumber = false;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    apellido: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    rolId: ['', [Validators.required]],
    password: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).+$/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, {
    validators: this.passwordMatchValidator
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    // Escuchar cambios en el campo password para actualizar los indicadores
    this.form.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordRequirements(password || '');
    });
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   */
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (confirmPassword.value === '') {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    } else {
      // Si coinciden, limpiar el error de mismatch pero mantener otros errores
      const errors = confirmPassword.errors;
      if (errors) {
        delete errors['passwordMismatch'];
        if (Object.keys(errors).length === 0) {
          confirmPassword.setErrors(null);
        }
      }
    }

    return null;
  }

  /**
   * Actualiza los indicadores visuales de requisitos de contraseña
   */
  updatePasswordRequirements(password: string): void {
    this.hasMinLength = password.length >= 8;
    this.hasUppercase = /[A-Z]/.test(password);
    this.hasLowercase = /[a-z]/.test(password);
    this.hasNumber = /\d/.test(password);
  }

  /**
   * Toggle para mostrar/ocultar contraseña
   */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Toggle para mostrar/ocultar confirmación de contraseña
   */
  toggleConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  /**
   * Registro de usuario
   */
  async register() {
    // Marcar todos los campos como touched para mostrar errores
    Object.keys(this.form.controls).forEach(key => {
      this.form.get(key)?.markAsTouched();
    });

    if (this.form.invalid) {
      await this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Registrando usuario...',
      spinner: 'crescent'
    });
    await loading.present();

    this.loading = true;

    const registerDto = {
      nombre: this.form.value.nombre!,
      apellido: this.form.value.apellido!,
      email: this.form.value.email!,
      password: this.form.value.password!,
      confirmPassword: this.form.value.confirmPassword!,
      rolId: Number(this.form.value.rolId!)
    };

    this.auth.register(registerDto).subscribe({
      next: async (response) => {
        this.loading = false;
        await loading.dismiss();
        
        await this.showToast('¡Registro exitoso! Bienvenido', 'success');
        
        // Redirigir al home (ya está logueado automáticamente)
        this.router.navigate(['/home']);
      },
      error: async (err) => {
        this.loading = false;
        await loading.dismiss();

        console.error('Error en registro:', err);

        let message = 'Ocurrió un error al registrarse';

        if (err.status === 400) {
          message = err.error?.message || 'El email ya está registrado';
        } else if (err.error?.message) {
          message = err.error.message;
        }

        await this.showToast(message, 'danger');
      }
    });
  }

  /**
   * Muestra un toast con un mensaje
   */
  async showToast(message: string, color: string = 'dark') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'bottom',
      color
    });
    await toast.present();
  }
}