import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { MaritimeShipmentService, type MaritimeShipment } from '../../service/maritime-shipment.service';
import { TerrestrialShipmentService, type TerrestrialShipment } from '../../service/terrestrial-shipment.service';

type ShipmentMode = 'Maritimo' | 'Terrestre';
type FilterMode = ShipmentMode | 'Todos';
type TrackingStatus = 'En transito' | 'Entregado' | 'Retrasado' | 'Pendiente';
type FilterStatus = TrackingStatus | 'Todos';

type ShipmentRow = {
  trackId: string;
  id: number;
  mode: ShipmentMode;
  guideNumber: string;
  status: string;
  trackingStatus: TrackingStatus;
  origin: string;
  destination: string;
  registrationDate: string;
  deliveryDate: string;
  shippingCost: number;
  totalCost: number;
};

type TrackingMetrics = {
  total: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  pending: number;
  compliance: number;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly maritimeShipmentService = inject(MaritimeShipmentService);
  private readonly terrestrialShipmentService = inject(TerrestrialShipmentService);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);

  readonly searchQuery = signal('');
  readonly modeFilter = signal<FilterMode>('Todos');
  readonly statusFilter = signal<FilterStatus>('Todos');

  readonly maritimeRows = signal<ShipmentRow[]>([]);
  readonly terrestrialRows = signal<ShipmentRow[]>([]);
  readonly selectedRow = signal<ShipmentRow | null>(null);

  readonly rows = computed(() => {
    const merged = [...this.maritimeRows(), ...this.terrestrialRows()];
    return merged.sort((a, b) => this.toTimestamp(b.registrationDate) - this.toTimestamp(a.registrationDate));
  });

  readonly metrics = computed<TrackingMetrics>(() => {
    const data = this.rows();
    const total = data.length;
    const delivered = data.filter((row) => row.trackingStatus === 'Entregado').length;
    const inTransit = data.filter((row) => row.trackingStatus === 'En transito').length;
    const delayed = data.filter((row) => row.trackingStatus === 'Retrasado').length;
    const pending = data.filter((row) => row.trackingStatus === 'Pendiente').length;
    const compliance = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return {
      total,
      inTransit,
      delivered,
      delayed,
      pending,
      compliance,
    };
  });

  readonly alerts = computed(() => {
    const data = this.rows();
    const delayed = data.filter((row) => row.trackingStatus === 'Retrasado').length;
    const overdue = data.filter((row) => this.isOverdue(row)).length;
    const withoutGuide = data.filter((row) => row.guideNumber === 'Sin guia').length;

    const messages: string[] = [];

    if (delayed > 0) {
      messages.push(`${delayed} envio(s) reportan estado retrasado.`);
    }
    if (overdue > 0) {
      messages.push(`${overdue} envio(s) ya superaron la fecha estimada de entrega.`);
    }
    if (withoutGuide > 0) {
      messages.push(`${withoutGuide} envio(s) no tienen numero de guia registrado.`);
    }

    return messages;
  });

  readonly filteredRows = computed(() => {
    const mode = this.modeFilter();
    const status = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return this.rows().filter((row) => {
      const modeMatch = mode === 'Todos' || row.mode === mode;
      const statusMatch = status === 'Todos' || row.trackingStatus === status;
      const queryMatch =
        query.length === 0 ||
        row.guideNumber.toLowerCase().includes(query) ||
        row.origin.toLowerCase().includes(query) ||
        row.destination.toLowerCase().includes(query) ||
        row.status.toLowerCase().includes(query);

      return modeMatch && statusMatch && queryMatch;
    });
  });

  readonly visibleRows = computed(() => this.filteredRows().slice(0, 12));

  // Carga inicial de metricas y movimientos al abrir el dashboard.
  constructor() {
    this.loadDashboard();
  }

  // Consulta ambos modulos de envios en paralelo y consolida resultados.
  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      maritime: this.maritimeShipmentService.getMaritimeShipmentList(),
      terrestrial: this.terrestrialShipmentService.getTerrestrialShipmentList(),
    }).subscribe({
      next: ({ maritime, terrestrial }) => {
        this.maritimeRows.set(maritime.map((shipment) => this.mapMaritimeRow(shipment)));
        this.terrestrialRows.set(terrestrial.map((shipment) => this.mapTerrestrialRow(shipment)));
        this.lastUpdated.set(new Date());
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion para consultar seguimiento.');
        } else {
          this.error.set('No fue posible cargar los datos del dashboard de seguimiento.');
        }
        this.loading.set(false);
      },
    });
  }

  // Actualiza busqueda libre para el filtro de tabla.
  setSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set(this.readControlValue(event));
  }

  setModeFilter(mode: FilterMode): void {
    this.modeFilter.set(mode);
  }

  onModeFilterChange(event: Event): void {
    const value = this.readControlValue(event);
    if (value === 'Maritimo' || value === 'Terrestre' || value === 'Todos') {
      this.modeFilter.set(value);
    }
  }

  setStatusFilter(status: FilterStatus): void {
    this.statusFilter.set(status);
  }

  // Abre panel/modal de detalle del envio seleccionado.
  openDetails(row: ShipmentRow): void {
    this.selectedRow.set(row);
  }

  // Cierra panel/modal de detalle.
  closeDetails(): void {
    this.selectedRow.set(null);
  }

  onStatusFilterChange(event: Event): void {
    const value = this.readControlValue(event);
    if (value === 'En transito' || value === 'Entregado' || value === 'Retrasado' || value === 'Pendiente' || value === 'Todos') {
      this.statusFilter.set(value);
    }
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

  // Formatea números a moneda local para mostrar en el detalle.
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(value);
  }

  // Convierte envio maritimo del backend a fila unificada de dashboard.
  private mapMaritimeRow(shipment: MaritimeShipment): ShipmentRow {
    return {
      trackId: `M-${shipment.id}`,
      id: shipment.id,
      mode: 'Maritimo',
      guideNumber: shipment.guideNumber?.trim() || 'Sin guia',
      status: shipment.status || 'Sin estado',
      trackingStatus: this.resolveTrackingStatus(shipment.status, shipment.deliveryDate),
      origin: this.resolveLocationLabel(null, shipment.originPort, 'Sin origen'),
      destination: this.resolveLocationLabel(null, shipment.destinationPort, 'Sin destino'),
      registrationDate: shipment.registrationDate,
      deliveryDate: shipment.deliveryDate,
      shippingCost: shipment.shippingCost,
      totalCost: shipment.totalCost,
    };
  }

  // Convierte envio terrestre del backend a fila unificada de dashboard.
  private mapTerrestrialRow(shipment: TerrestrialShipment): ShipmentRow {
    return {
      trackId: `T-${shipment.id}`,
      id: shipment.id,
      mode: 'Terrestre',
      guideNumber: shipment.guideNumber?.trim() || 'Sin guia',
      status: shipment.status || 'Sin estado',
      trackingStatus: this.resolveTrackingStatus(shipment.status, shipment.deliveryDate),
      origin: this.resolveLocationLabel(shipment.originBodega, shipment.originPort, 'Sin origen'),
      destination: this.resolveLocationLabel(shipment.destinationBodega, shipment.destinationPort, 'Sin destino'),
      registrationDate: shipment.registrationDate,
      deliveryDate: shipment.deliveryDate,
      shippingCost: shipment.shippingCost,
      totalCost: shipment.totalCost,
    };
  }

  private resolveLocationLabel(
    bodega: TerrestrialShipment['originBodega'],
    port: TerrestrialShipment['originPort'],
    fallback: string,
  ): string {
    if (bodega?.name) {
      return `${bodega.name} (Bodega)`;
    }
    if (bodega?.id) {
      return `Bodega #${bodega.id}`;
    }
    if (port?.name) {
      return `${port.name} (Puerto)`;
    }
    if (port?.id) {
      return `Puerto #${port.id}`;
    }
    return fallback;
  }

  // Normaliza diferentes textos de estado a estados de seguimiento estandar.
  private resolveTrackingStatus(rawStatus: string, deliveryDate: string): TrackingStatus {
    const normalizedStatus = this.normalizeStatus(rawStatus);

    if (
      normalizedStatus.includes('entreg') ||
      normalizedStatus.includes('deliver') ||
      normalizedStatus.includes('complet') ||
      normalizedStatus.includes('finaliz') ||
      normalizedStatus.includes('done')
    ) {
      return 'Entregado';
    }
    if (
      normalizedStatus.includes('retras') ||
      normalizedStatus.includes('demor') ||
      normalizedStatus.includes('delay') ||
      normalizedStatus.includes('late') ||
      normalizedStatus.includes('cancel')
    ) {
      return 'Retrasado';
    }
    if (
      normalizedStatus.includes('transit') ||
      normalizedStatus.includes('ruta') ||
      normalizedStatus.includes('proceso') ||
      normalizedStatus.includes('camino')
    ) {
      return 'En transito';
    }
    if (normalizedStatus.includes('pend') || normalizedStatus.includes('wait') || normalizedStatus.includes('hold')) {
      return 'Pendiente';
    }

    const dueDate = this.toTimestamp(deliveryDate);
    const today = this.todayTimestamp();
    if (dueDate > 0 && dueDate < today) {
      return 'Retrasado';
    }

    return 'Pendiente';
  }

  private isOverdue(row: ShipmentRow): boolean {
    if (row.trackingStatus === 'Entregado') {
      return false;
    }

    const dueDate = this.toTimestamp(row.deliveryDate);
    return dueDate > 0 && dueDate < this.todayTimestamp();
  }

  private toTimestamp(dateValue: string): number {
    const timestamp = Date.parse(dateValue);
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  private todayTimestamp(): number {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  }

  private readControlValue(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement || target instanceof HTMLSelectElement ? target.value : '';
  }

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
