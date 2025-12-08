export interface Aula {
  id: number;
  nombre: string;
  descripcion?: string;
  capacidadEstudiantes: number;
  estatus: boolean;
  tipoAulaId: number;
  edificioId: number;
  tipoAula?: any;
  edificio?: any;
}

export interface SolicitudApartado {
  Fecha: string;
  HoraInicio: string; 
  HoraFin: string;
  Estado: string;
  Aula: Aula; 
  Motivo: string;
}