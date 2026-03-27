import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  // AuthService define sesion activa; Router redirige si no hay acceso.
  constructor(private authService: AuthService, private router: Router) {}

  // Permite navegacion solo cuando hay sesion; si no, envia a login.
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
