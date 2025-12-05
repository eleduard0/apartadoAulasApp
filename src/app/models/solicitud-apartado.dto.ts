export interface CreateSolicitudApartadoDto {
  fecha: string;         // '2025-12-04'
  horaInicio: string;    // '08:00'
  horaFin: string;       // '10:00'
  motivo: string;
  usuarioId: number;
  aulaId: number;
}
