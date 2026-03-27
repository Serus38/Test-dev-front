import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';
import { AuthService } from '../../service/auth.service';

type SectionKey =
  | 'dashboard'
  | 'clientes'
  | 'bodegas'
  | 'terrestrial_shipments'
  | 'puertos'
  | 'maritime_shipments';

type NavSection = {
  key: SectionKey;
  label: string;
  listLabel: string;
  newLabel: string;
  listPath: string;
  newPath: string;
};

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Estado de sesion y usuario para renderizar acciones del navbar.
  readonly isLoggedIn = toSignal(this.authService.isLoggedIn$, {
    initialValue: this.authService.isAuthenticated(),
  });
  readonly user = toSignal(this.authService.user$, {
    initialValue: this.authService.getUsername(),
  });

  readonly sections: ReadonlyArray<NavSection> = [
       {
      key: 'clientes',
      label: 'Clientes',
      listLabel: 'Listar clientes',
      newLabel: 'Nuevo cliente',
      listPath: '/clientes',
      newPath: '/add-client',
    },
    {
      key: 'bodegas',
      label: 'Bodegas',
      listLabel: 'Listar bodegas',
      newLabel: 'Nueva bodega',
      listPath: '/bodegas',
      newPath: '/bodegas/new',
    },
    {
      key: 'terrestrial_shipments',
      label: 'Envios terrestres',
      listLabel: 'Listar envios terrestres',
      newLabel: 'Nuevo envio terrestre',
      listPath: '/terrestrial_shipments',
      newPath: '/terrestrial_shipments/new',
    },
    {
      key: 'puertos',
      label: 'Puertos',
      listLabel: 'Listar puertos',
      newLabel: 'Nuevo puerto',
      listPath: '/puertos',
      newPath: '/puertos/new',
    },
    {
      key: 'maritime_shipments',
      label: 'Envios maritimos',
      listLabel: 'Listar envios maritimos',
      newLabel: 'Nuevo envio maritimo',
      listPath: '/maritime_shipments',
      newPath: '/maritime_shipments/new',
    },
  ];

  readonly secondarySections: ReadonlyArray<NavSection> = this.sections.filter((section) => section.key !== 'dashboard');

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(() => this.router.url),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly activeSection = computed(() => this.resolveSection(this.url()));

  // Resuelve la seccion activa segun la URL actual.
  private resolveSection(url: string): NavSection {
    if (url.startsWith('/clientes')) {
      return this.sections[0];
    }
    if (url.startsWith('/bodegas')) {
      return this.sections[1];
    }
    if (url.startsWith('/terrestrial_shipments')) {
      return this.sections[2];
    }
    if (url.startsWith('/puertos')) {
      return this.sections[3];
    }
    if (url.startsWith('/maritime_shipments')) {
      return this.sections[4];
    }
    return this.sections[0];
  }

  // Cierra sesion y retorna a la pantalla de autenticacion.
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
