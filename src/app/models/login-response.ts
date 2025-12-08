export interface Reserva {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  fechaSolicitud: string;
  usuarioId: number;
  aulaId: number;
}

export interface LoginResponse {
  idUsuario: number;
  nombre: string;
  totalReservas: number;
  totalActivasHoy: number;
  proximasReservas: Reserva[];
}

export interface LoginDto {
  email: string;
  password: string;
}