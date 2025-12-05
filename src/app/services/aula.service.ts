import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AulaService {

  private apiUrl = 'https://apartadoaulasapi-2.onrender.com/api/Aula';

  constructor(private http: HttpClient) {}

  getAulas(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }
}
