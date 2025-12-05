import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { LoginResponse } from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://localhost:7045/api/Auth/Login'; // 🔥 Cambia aquí tu URL base

  private userSubject = new BehaviorSubject<LoginResponse | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.loadSession();
  }

  // ------------------------
  // LOGIN
  // ------------------------
  login(email: string, password: string) {
    const body = { email, password };

    return this.http.post<LoginResponse>(this.apiUrl, body)
      .pipe(
        tap(res => {
          this.saveSession(res);
        })
      );
  }

  // ------------------------
  // GUARDAR SESIÓN
  // ------------------------
  saveSession(data: LoginResponse) {
    localStorage.setItem('userData', JSON.stringify(data));
    this.userSubject.next(data);
  }

  // ------------------------
  // CARGAR SESIÓN AL INICIAR APP
  // ------------------------
  loadSession() {
    const data = localStorage.getItem('userData');
    if (data) {
      this.userSubject.next(JSON.parse(data));
    }
  }

  // ------------------------
  // LOGOUT
  // ------------------------
  logout() {
    localStorage.removeItem('userData');
    this.userSubject.next(null);
    this.router.navigate(['/login']);
  }

  // ------------------------
  // Saber si está autenticado
  // ------------------------
  isLoggedIn(): boolean {
    return this.userSubject.value !== null;
  }

  getUser(): LoginResponse | null {
    return this.userSubject.value;
  }
}
