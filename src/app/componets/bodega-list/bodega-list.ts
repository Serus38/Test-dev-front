import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { BodegaService, type Bodega } from '../../service/bodega.service';

@Component({
  selector: 'app-bodega-list',
  imports: [RouterLink],
  templateUrl: './bodega-list.html',
  styleUrl: './bodega-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodegaList {
  private readonly bodegaService = inject(BodegaService);

  readonly bodegas = signal<Bodega[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  // Carga inicial de datos al abrir la vista.
  constructor() {
    this.listBodegas();
  }

  // Consulta la lista de bodegas y actualiza estados de carga/error.
  listBodegas(): void {
    this.loading.set(true);
    this.error.set(null);

    this.bodegaService.getBodegaList().subscribe({
      next: (data) => {
        this.bodegas.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar la lista de bodegas desde el backend.');
        }
        this.loading.set(false);
      },
    });
  }

  // Elimina una bodega y refresca la lista para mantener la vista sincronizada.
  deleteBodega(id: number): void {
    this.bodegaService.deleteBodega(id).subscribe(
      () => this.listBodegas(),
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo eliminar la bodega.');
        }
      },
    );
  }
}
