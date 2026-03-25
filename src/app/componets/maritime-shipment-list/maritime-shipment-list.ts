import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MaritimeShipmentService, type MaritimeShipment } from '../../service/maritime-shipment.service';

@Component({
  selector: 'app-maritime-shipment-list',
  imports: [RouterLink],
  templateUrl: './maritime-shipment-list.html',
  styleUrl: './maritime-shipment-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeShipmentList {
  private readonly maritimeShipmentService = inject(MaritimeShipmentService);

  readonly shipments = signal<MaritimeShipment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.listShipments();
  }

  listShipments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.maritimeShipmentService.getMaritimeShipmentList().subscribe({
      next: (data) => {
        this.shipments.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar la lista de envios maritimos desde el backend.');
        }
        this.loading.set(false);
      },
    });
  }

  deleteShipment(id: number): void {
    this.maritimeShipmentService.deleteMaritimeShipment(id).subscribe(
      () => this.listShipments(),
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo eliminar el envio maritimo.');
        }
      },
    );
  }
}
