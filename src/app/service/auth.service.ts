import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Base del modulo de autenticacion del backend.
  private readonly apiBase = (import.meta.env['VITE_API_URL'] ?? 'http://localhost:8081').replace(/\/$/, '');
  private readonly apiUrl = `${this.apiBase}/auth`;
  // Claves persistidas para rehidratar sesion al recargar la app.
  private tokenKey = 'authToken';
  private usernameKey = 'username';
  
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private userSubject = new BehaviorSubject<string | null>(this.getUsername());
  public user$ = this.userSubject.asObservable();

  // Inyecta HttpClient para login/validacion de token.
  constructor(private httpClient: HttpClient) {}

  // Ejecuta login y sincroniza estado reactivo + almacenamiento local.
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.httpClient.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem(this.tokenKey, response.token);
        localStorage.setItem(this.usernameKey, response.username);
        this.isLoggedInSubject.next(true);
        this.userSubject.next(response.username);
      })
    );
  }

  // Cierra sesion local limpiando token e identidad del usuario.
  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.usernameKey);
    this.isLoggedInSubject.next(false);
    this.userSubject.next(null);
  }

  // Retorna el JWT actual (si existe).
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Retorna el usuario persistido para pintar UI.
  getUsername(): string | null {
    return localStorage.getItem(this.usernameKey);
  }

  // Verifica presencia de token en almacenamiento.
  hasToken(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // API simple usada por guards/componentes para proteger vistas.
  isAuthenticated(): boolean {
    return this.hasToken();
  }

  // Validacion opcional del token contra el backend.
  validateToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return new Observable(observer => {
        observer.next(false);
        observer.complete();
      });
    }
    return this.httpClient.post<boolean>(`${this.apiUrl}/validate`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
}
