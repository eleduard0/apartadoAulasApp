export interface RegisterDto {
    nombre: string;
    apellido: string;
    email: string;
    password: string;
    confirmPassword: string;
    rolId: number;
  }
  
  export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
  }
  
  // Roles disponibles en el sistema
  export const ROLES = {
    ESTUDIANTE: 4,
    PROFESOR: 3
  } as const;