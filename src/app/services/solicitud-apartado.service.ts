import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CreateSolicitudApartadoDto } from '../models/solicitud-apartado.dto';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SolicitudApartadoService {

  private apiUrl = 'https://apartadoaulasapi-2.onrender.com/api/SolicitudApartado';

  constructor(private http: HttpClient) {}

  crearSolicitud(dto: CreateSolicitudApartadoDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/CreateSolicitud`, dto);
  }

  getReservas(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetReservas`);
  }

}
