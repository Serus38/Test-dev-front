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

  // Carga inicial de envios terrestres.
  constructor() {
    this.listShipments();
  }

  // Obtiene, ordena por fecha y publica el resultado en la vista.
  listShipments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.terrestrialShipmentService.getTerrestrialShipmentList().subscribe({
      next: (shipments) => {
        const sorted = [...shipments].sort(
          (a, b) =>
            new Date(b.registrationDate || b.deliveryDate).getTime() -
            new Date(a.registrationDate || a.deliveryDate).getTime(),
        );
        this.shipments.set(sorted);
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

  // Elimina envio y refresca la tabla.
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

  // Construye etiqueta legible de origen segun bodega/puerto disponible.
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

  // Construye etiqueta legible de destino segun bodega/puerto disponible.
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

  getFullLocation(bodega: any, puerto: any): string {
    if (bodega) {
      return `${bodega.name} - ${bodega.city}, ${bodega.country} (Bodega)`;
    }
    if (puerto) {
      return `${puerto.name} - ${puerto.city}, ${puerto.country} (Puerto)`;
    }
    return 'N/A';
  }

  // Abre modal con detalle completo del envio.
  openDetails(shipment: TerrestrialShipment): void {
    this.selectedShipment.set(shipment);
  }

  // Cierra modal de detalle.
  closeDetails(): void {
    this.selectedShipment.set(null);
  }

  isDeliveredStatus(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return (
      normalized.includes('entreg') ||
      normalized.includes('deliver') ||
      normalized.includes('complet') ||
      normalized.includes('finaliz') ||
      normalized.includes('done')
    );
  }

  isDelayedStatus(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return (
      normalized.includes('retras') ||
      normalized.includes('demor') ||
      normalized.includes('delay') ||
      normalized.includes('late') ||
      normalized.includes('cancel')
    );
  }

  isTransitStatus(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return (
      normalized.includes('transit') ||
      normalized.includes('ruta') ||
      normalized.includes('proceso') ||
      normalized.includes('camino')
    );
  }

  isPendingStatus(status: string): boolean {
    const normalized = this.normalizeStatus(status);
    return normalized.includes('pend') || normalized.includes('wait') || normalized.includes('hold');
  }

  // Normaliza texto de estado para reglas de clasificacion visual.
  private normalizeStatus(status: string | null | undefined): string {
    return (status ?? '')
      .toString()
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');
  }
}

