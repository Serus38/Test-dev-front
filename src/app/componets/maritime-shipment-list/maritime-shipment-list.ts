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
  readonly selectedShipment = signal<MaritimeShipment | null>(null);

  // Carga inicial del listado de envios maritimos.
  constructor() {
    this.listShipments();
  }

  private toTimestamp(dateValue: string): number {
    const timestamp = Date.parse(dateValue);
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  // Obtiene, ordena por fecha y publica el resultado en la vista.
  listShipments(): void {
    this.loading.set(true);
    this.error.set(null);

    this.maritimeShipmentService.getMaritimeShipmentList().subscribe({
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
          this.error.set('No se pudo cargar la lista de envios maritimos desde el backend.');
        }
        this.loading.set(false);
      },
    });
  }

  // Formatea números a moneda local para mostrar en la tabla.
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Formatea fechas a formato local legible para mostrar en tabla y detalle.
  formatDate(dateValue: string): string {
    const timestamp = this.toTimestamp(dateValue);
    if (timestamp === 0) {
      return 'Sin fecha';
    }

    return new Date(timestamp).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  // Elimina envio y recarga el listado para mantener consistencia.
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
      // Abre modal de detalle con el envio seleccionado.
  }

  getOrigin(shipment: MaritimeShipment): string {
    return shipment.originPort?.name?.trim() ? shipment.originPort.name : 'Origen no disponible';
  }

  getDestination(shipment: MaritimeShipment): string {
    return shipment.destinationPort?.name?.trim() ? shipment.destinationPort.name : 'Destino no disponible';
  }


  openDetails(shipment: MaritimeShipment): void {
    this.selectedShipment.set(shipment);
  }

  // Cierra el modal de detalle.
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

  // Normaliza estados para clasificacion visual consistente.
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
