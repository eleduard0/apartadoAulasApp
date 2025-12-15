import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Usuario, UpdateUserDto, ChangePasswordDto } from '../models/perfil.interfaces';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  private apiUrl = 'https://localhost:44333/api/Usuario';
  private authUrl = 'https://localhost:44333/api/Auth';

  constructor(private http: HttpClient) {}

  /**
   * Obtiene un usuario por ID
   * GET /api/Usuario/{id}
   */
  async getUserById(id: number): Promise<Usuario> {
    return firstValueFrom(
      this.http.get<Usuario>(`${this.apiUrl}/${id}`)
    );
  }

  /**
   * Obtiene todos los usuarios
   * GET /api/Usuario
   */
  async getAllUsers(): Promise<Usuario[]> {
    return firstValueFrom(
      this.http.get<Usuario[]>(this.apiUrl)
    );
  }

  /**
   * Actualiza un usuario
   * PUT /api/Usuario/UpdateUser
   */
  async updateUser(updateDto: UpdateUserDto): Promise<Usuario> {
    return firstValueFrom(
      this.http.put<Usuario>(`${this.apiUrl}/UpdateUser`, updateDto)
    );
  }

  /**
   * Cambia la contraseña del usuario
   * POST /api/Auth/ChangePassword
   */
  async changePassword(changePasswordDto: ChangePasswordDto): Promise<void> {
    return firstValueFrom(
      this.http.post<void>(`${this.authUrl}/ChangePassword`, changePasswordDto)
    );
  }
}