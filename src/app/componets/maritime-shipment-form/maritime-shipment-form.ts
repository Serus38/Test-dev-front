import { ChangeDetectionStrategy, Component, OnInit, DestroyRef, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ClientService, type Client } from '../../service/client.service';
import { MaritimeShipmentService, type MaritimeShipment } from '../../service/maritime-shipment.service';
import { PortService, type Port } from '../../service/port.service';

type CreateMaritimeShipmentInput = Parameters<MaritimeShipmentService['createMaritimeShipment']>[0];

@Component({
  selector: 'app-maritime-shipment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './maritime-shipment-form.html',
  styleUrl: './maritime-shipment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeShipmentForm implements OnInit {
  private readonly maritimeShipmentService = inject(MaritimeShipmentService);
  private readonly clientService = inject(ClientService);
  private readonly portService = inject(PortService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly shipmentCreated = output<MaritimeShipment>();
  readonly isEditMode = signal(false);
  readonly editShipmentId = signal<number | null>(null);
  readonly clients = signal<Client[]>([]);
  readonly ports = signal<Port[]>([]);

  readonly form = this.fb.nonNullable.group({
    deliveryDate: ['', Validators.required],
    destination: ['', Validators.required],
    discountRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    fleetNumber: ['', Validators.required],
    guideNumber: ['', Validators.required],
    origin: ['', Validators.required],
    productType: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    registrationDate: ['', Validators.required],
    shippingCost: [0, [Validators.required, Validators.min(0)]],
    status: ['', Validators.required],
    totalCost: [0, [Validators.required, Validators.min(0)]],
    client_id: [0, [Validators.required, Validators.min(0)]],
    port_id: [0, [Validators.required, Validators.min(0)]],
    qr_code: ['', Validators.required],

  });

  private toPayload(): CreateMaritimeShipmentInput {
    const raw = this.form.getRawValue();
    return {
      ...raw,
      discountRate: Number(raw.discountRate),
      quantity: Number(raw.quantity),
      shippingCost: Number(raw.shippingCost),
      totalCost: Number(raw.totalCost),
      client_id: Number(raw.client_id),
      port_id: Number(raw.port_id),
    };
  }

  ngOnInit(): void {
    this.loadOptions();
    this.setupAutomaticPricing();

    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const shipmentId = Number(id);
      this.editShipmentId.set(shipmentId);
      this.isEditMode.set(true);
      this.loadShipmentData(shipmentId);
    }
  }

  private loadOptions(): void {
    this.clientService.getClientList().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.error.set('No se pudo cargar la lista de clientes.'),
    });

    this.portService.getPortList().subscribe({
      next: (ports) => this.ports.set(ports),
      error: () => this.error.set('No se pudo cargar la lista de puertos.'),
    });
  }

  onDestinationChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedPortId = Number(select.value);
    this.applyPortSelection(selectedPortId);
  }

  onPortChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedPortId = Number(select.value);
    this.applyPortSelection(selectedPortId);
  }

  private applyPortSelection(selectedPortId: number): void {
    const selectedPort = this.ports().find((port) => port.id === selectedPortId);

    if (!selectedPort) {
      this.form.patchValue({ destination: '' });
      return;
    }

    this.form.patchValue({
      destination: `${selectedPort.name} - ${selectedPort.city}, ${selectedPort.country}`,
      port_id: selectedPort.id,
    });
  }

  private setupAutomaticPricing(): void {
    this.form.controls.quantity.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateDiscountAndTotalCost());

    this.form.controls.shippingCost.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.updateDiscountAndTotalCost());

    this.updateDiscountAndTotalCost();
  }

  private updateDiscountAndTotalCost(): void {
    const quantity = Math.max(0, Number(this.form.controls.quantity.value ?? 0));
    const shippingCostPerProduct = Math.max(0, Number(this.form.controls.shippingCost.value ?? 0));

    const discountRate = Math.min(100, Math.floor(quantity / 10) * 5);
    const subtotal = quantity * shippingCostPerProduct;
    const totalCost = Number((subtotal * (1 - discountRate / 100)).toFixed(2));

    this.form.patchValue(
      {
        discountRate,
        totalCost,
      },
      { emitEvent: false },
    );
  }

  private loadShipmentData(id: number): void {
    this.loading.set(true);
    this.maritimeShipmentService.getMaritimeShipmentById(id).subscribe({
      next: (shipment) => {
        this.form.patchValue({
          deliveryDate: shipment.deliveryDate,
          destination: shipment.destination,
          discountRate: Number(shipment.discountRate),
          fleetNumber: shipment.fleetNumber,
          guideNumber: shipment.guideNumber,
          origin: shipment.origin,
          productType: shipment.productType,
          quantity: Number(shipment.quantity),
          registrationDate: shipment.registrationDate,
          shippingCost: Number(shipment.shippingCost),
          status: shipment.status,
          totalCost: Number(shipment.totalCost),
          client_id: Number(shipment.client_id),
          port_id: Number(shipment.port_id),
          qr_code: shipment.qr_code,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el envio maritimo para editar.');
        this.loading.set(false);
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload = this.toPayload();

    const request$ = this.isEditMode()
      ? this.maritimeShipmentService.updateMaritimeShipment(this.editShipmentId()!, payload)
      : this.maritimeShipmentService.createMaritimeShipment(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (shipment) => {
          if (!this.isEditMode()) {
            this.form.reset({
              deliveryDate: '',
              destination: '',
              discountRate: 0,
              fleetNumber: '',
              guideNumber: '',
              origin: '',
              productType: '',
              quantity: 0,
              registrationDate: '',
              shippingCost: 0,
              status: '',
              totalCost: 0,
              client_id: 0,
              port_id: 0,
              qr_code: '',
            });
          }
          this.success.set(true);
          this.shipmentCreated.emit(shipment);
          setTimeout(() => void this.router.navigate(['/maritime_shipments'], { replaceUrl: true }), 800);
        },
        error: (err: HttpErrorResponse | Error) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 401) {
              this.error.set('401 Unauthorized: el backend requiere autenticación.');
            } else if (err.status === 400) {
              this.error.set('Datos inválidos. Verifica los campos.');
            } else if (err.status === 0) {
              this.error.set('No se pudo conectar con el servidor (CORS/red).');
            } else {
              this.error.set('Error al guardar el envio maritimo.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al guardar el envio maritimo.');
          }
        },
      });
  }
}
