import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable, tap } from 'rxjs';
import { LoginResponse, LoginDto } from '../models/login-response';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'https://apartadoaulasapi-1.onrender.com/api/Auth'; // 🔥 Cambia aquí tu URL base

   private currentUserSubject: BehaviorSubject<LoginResponse | null>;
  public currentUser: Observable<LoginResponse | null>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Cargar usuario desde localStorage al iniciar
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<LoginResponse | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /**
   * Obtiene el valor actual del usuario logueado
   */
  public get currentUserValue(): LoginResponse | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el ID del usuario logueado
   */
  public get userId(): number | null {
    return this.currentUserValue?.idUsuario || null;
  }
  

  /**
   * Verifica si hay un usuario logueado
   */
  public get isLoggedIn(): boolean {
    return this.currentUserValue !== null;
  }

  /**
   * Login de usuario
   * POST /api/Auth/Login
   */
  login(email: string, password: string): Observable<LoginResponse> {
  const loginDto: LoginDto = { email, password };

  return this.http.post<LoginResponse>(`${this.apiUrl}/Login`, loginDto).pipe(
    tap(response => {
      // Guardar usuario en localStorage
      localStorage.setItem('currentUser', JSON.stringify(response));

      // Actualizar subject
      this.currentUserSubject.next(response);
    })
  );
}

  async refreshUser(): Promise<void> {
  const userId = this.userId;
  if (!userId) return Promise.resolve();

  return firstValueFrom(
    this.http.get<LoginResponse>(`${this.apiUrl}/GetInfoUser?id=${userId}`)
  )
    .then(userInfo => {
      // Solo refrescamos TotalReservas, TotalActivasHoy y ProximasReservas
      const current = this.currentUserValue;

      if (current) {
        current.totalReservas = userInfo.totalReservas;
        current.totalActivasHoy = userInfo.totalActivasHoy;
        current.proximasReservas = userInfo.proximasReservas;
      }

      // Guardar info actualizada
      localStorage.setItem('currentUser', JSON.stringify(current));
      this.currentUserSubject.next(current!);
    })
    .catch(err => {
      console.error("Error refrescando usuario:", err);
    });
}

  /**
   * Logout de usuario
   */
  logout(): void {
    // Remover usuario del localStorage
    localStorage.removeItem('currentUser');
    
    // Actualizar subject
    this.currentUserSubject.next(null);
    
    // Redirigir al login
    this.router.navigate(['/login']);
  }

  /**
   * Actualizar información del usuario en localStorage
   * Útil después de crear una reserva para actualizar los contadores
   */
  updateUserInfo(userInfo: LoginResponse): void {
    localStorage.setItem('currentUser', JSON.stringify(userInfo));
    this.currentUserSubject.next(userInfo);
  }

  /**
   * Obtener información actualizada del usuario
   * Puedes llamar a un endpoint refresh si tu API lo tiene
   */
  async refreshUserInfo(): Promise<void> {
    if (!this.isLoggedIn) return;

    try {
      // Si tienes un endpoint para refrescar info del usuario, úsalo aquí
      // Por ahora, solo obtenemos lo que ya tenemos
      const currentUser = this.currentUserValue;
      if (currentUser) {
        this.updateUserInfo(currentUser);
      }
    } catch (error) {
      console.error('Error al refrescar información del usuario:', error);
    }
  }
}