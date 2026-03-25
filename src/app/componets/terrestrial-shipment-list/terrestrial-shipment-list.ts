import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { TerrestrialShipmentService, type TerrestrialShipment } from '../../service/terrestrial-shipment.service';

@Component({
  selector: 'app-terrestrial-shipment-list',
  imports: [RouterLink],
  templateUrl: './terrestrial-shipment-list.html',
  styleUrl: './terrestrial-shipment-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrestrialShipmentList {
  private readonly terrestrialShipmentService = inject(TerrestrialShipmentService);

  readonly shipments = signal<TerrestrialShipment[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly selectedShipment = signal<TerrestrialShipment | null>(null);

  constructor() {
    this.listShipments();
  }

  listShipments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.terrestrialShipmentService.getTerrestrialShipmentList().subscribe({
      next: (data) => {
        this.shipments.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar la lista de envios terrestres desde el backend.');
        }
        this.loading.set(false);
      },
    });
  }

  deleteShipment(id: number): void {
    this.terrestrialShipmentService.deleteTerrestrialShipment(id).subscribe(
      () => this.listShipments(),
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo eliminar el envio terrestre.');
        }
      },
    );
  }

  getOrigin(shipment: TerrestrialShipment): string {
    if (shipment.originBodega) {
      return shipment.originBodega.name
        ? `${shipment.originBodega.name} (Bodega)`
        : `Bodega #${shipment.originBodega.id}`;
    }
    if (shipment.originPort) {
      return shipment.originPort.name
        ? `${shipment.originPort.name} (Puerto)`
        : `Puerto #${shipment.originPort.id}`;
    }
    return 'Sin origen';
  }

  getDestination(shipment: TerrestrialShipment): string {
    if (shipment.destinationBodega) {
      return shipment.destinationBodega.name
        ? `${shipment.destinationBodega.name} (Bodega)`
        : `Bodega #${shipment.destinationBodega.id}`;
    }
    if (shipment.destinationPort) {
      return shipment.destinationPort.name
        ? `${shipment.destinationPort.name} (Puerto)`
        : `Puerto #${shipment.destinationPort.id}`;
    }
    return 'Sin destino';
  }

  openDetails(shipment: TerrestrialShipment): void {
    this.selectedShipment.set(shipment);
  }

  closeDetails(): void {
    this.selectedShipment.set(null);
  }

  getFullLocation(bodega: any, puerto: any): string {
    if (bodega) {
      return `${bodega.name} - ${bodega.city}, ${bodega.country} (Bodega)`;
    }
    if (puerto) {
      return `${puerto.name} - ${puerto.city}, ${puerto.country} (Puerto)`;
    }
    return 'N/A';
  }
}

