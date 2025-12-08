import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Aula } from '../models/solicitud-apartado';

@Injectable({
  providedIn: 'root'
})
export class AulaService {

  private apiUrl = 'https://apartadoaulasapi-1.onrender.com/api';

  constructor(
    private http: HttpClient,
  ) {}

  /**
   * Obtiene todas las aulas disponibles
   * Intenta primero la red, si falla usa caché offline
   */
  async getAulas(): Promise<Aula[]> {
    try {
      const aulas = await firstValueFrom(
        this.http.get<Aula[]>(`${this.apiUrl}/Aula`)
      );
      // Guarda en caché si se obtienen correctamente
      
      return aulas;
    } catch (error) {
      console.error('Error en getAulas (intentando caché offline):', error);
      // Si falla, intenta obtener del caché offline
      
    
      throw error;
    }
  }

  /**
   * Obtiene un aula por ID
   */
  async getAulaById(id: number): Promise<Aula> {
    try {
      return await firstValueFrom(
        this.http.get<Aula>(`${this.apiUrl}/Aula/${id}`)
      );
    } catch (error) {
      console.error('Error en getAulaById:', error);
      throw error;
    }
  }
}

