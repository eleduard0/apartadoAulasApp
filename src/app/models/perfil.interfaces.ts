export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  matricula: string | null;
  password?: string; // No se muestra en frontend
  refreshToken?: string | null;
  estatus: boolean;
  fechaRegistro: string;
  rolId: number;
  rol: Rol;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  clave: string;
  estatus: boolean;
}

export interface UpdateUserDto {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  password: string; // Mantener la misma si no se cambia
  confirmPassword: string;
  estatus: boolean;
  rolId: number;
}

export interface ChangePasswordDto {
  usuarioId: number;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UserStats {
  totalReservas: number;
  reservasActivas: number;
  ultimaReserva?: string;
}