import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { PortService, type Port } from '../../service/port.service';

@Component({
  selector: 'app-port-list',
  imports: [RouterLink],
  templateUrl: './port-list.html',
  styleUrl: './port-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortList {
  private readonly portService = inject(PortService);

  readonly ports = signal<Port[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Carga inicial de puertos al abrir la vista.
  constructor() {
    this.listPorts();
  }

  // Consulta puertos y maneja estados de carga/error para la tabla.
  listPorts(): void {
    this.loading.set(true);
    this.error.set(null);

    this.portService.getPortList().subscribe({
      next: (data) => {
        this.ports.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar la lista de puertos desde el backend.');
        }
        this.loading.set(false);
      },
    });
  }

  // Elimina un puerto y vuelve a consultar la lista.
  deletePort(id: number): void {
    this.portService.deletePort(id).subscribe(
      () => this.listPorts(),
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo eliminar el puerto.');
        }
      },
    );
  }
}
