export interface ReservaHistorial {
  id: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado: string;
  fechaSolicitud: string;
  usuarioId: number;
  aulaId: number;
  aula: {
    id: number;
    nombre: string;
    descripcion: string;
    capacidadEstudiantes: number;
    estatus: boolean;
    tipoAulaId: number;
    edificioId: number;
  };
}