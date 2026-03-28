import { ChangeDetectionStrategy, Component, OnInit, DestroyRef, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ClientService, type Client } from '../../service/client.service';
import { PortService, type Port } from '../../service/port.service';
import {
  MaritimeShipmentService,
  type MaritimeShipment,
  type MaritimeShipmentUpsertInput,
} from '../../service/maritime-shipment.service';

type CreateMaritimeShipmentInput = MaritimeShipmentUpsertInput;

@Component({
  selector: 'app-maritime-shipment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './maritime-shipment-form.html',
  styleUrl: './maritime-shipment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaritimeShipmentForm implements OnInit {
  private readonly MaritimeShipmentService = inject(MaritimeShipmentService);
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
    productType: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    originBodega_id: [0],
    destinationBodega_id: [0],
    originPort_id: [0, Validators.required],
    destinationPort_id: [0, Validators.required],
    registrationDate: ['', Validators.required],
    deliveryDate: ['', Validators.required],
    client_id: [0, [Validators.required, Validators.min(1)]],
    shippingCost: ['', [Validators.required, Validators.min(0)]],
    discountRate: [0],
    totalCost: [0],
    guideNumber: [''],
    fleetNumber: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[A-Za-z]{3}\d{4}[A-Za-z]$/),
      ],
    ],
    status: [''],
  });

  // Formatea input de costo para UX y sincroniza valor numerico real.
  onShippingCostInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value ?? '').replace(/\D/g, '');

    if (!digits) {
      this.form.controls.shippingCost.setValue('', { emitEvent: false });
      input.value = '';
      return;
    }

    const numericValue = Number(digits);
    this.form.controls.shippingCost.setValue(String(numericValue), { emitEvent: false });
    input.value = new Intl.NumberFormat('es-CO').format(numericValue);
  }

  // Convierte el valor del formulario al DTO esperado por el backend.
  private toPayload(): CreateMaritimeShipmentInput {
    const raw = this.form.getRawValue();
    const {
      discountRate: _discountRate,
      totalCost: _totalCost,
      guideNumber: _guideNumber,
      originBodega_id,
      destinationBodega_id,
      originPort_id,
      destinationPort_id,
      client_id,
      ...rest
    } = raw;

    return {
      ...rest,
      productType: rest.productType,
      quantity: Number(raw.quantity),
      originBodega: originBodega_id ? { id: Number(originBodega_id) } : null,
      destinationBodega: destinationBodega_id ? { id: Number(destinationBodega_id) } : null,
      originPort: originPort_id ? { id: Number(originPort_id) } : null,
      destinationPort: destinationPort_id ? { id: Number(destinationPort_id) } : null,
      registrationDate: rest.registrationDate,
      deliveryDate: rest.deliveryDate,
      client: { id: Number(client_id) },
      shippingCost: Number(raw.shippingCost),
      fleetNumber: rest.fleetNumber,
      status: rest.status,
    } as CreateMaritimeShipmentInput;
  }

  // Inicializa catalogos y determina si el flujo es de edicion.
  ngOnInit(): void {
    this.loadOptions();
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const shipmentId = Number(id);
      this.editShipmentId.set(shipmentId);
      this.isEditMode.set(true);
      this.loadShipmentData(shipmentId);
    }
  }

  // Carga catalogos auxiliares (clientes y puertos) para selects.
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


  // Recupera envio existente y precarga el formulario en modo edicion.
  private loadShipmentData(id: number): void {
    this.loading.set(true);
    this.MaritimeShipmentService.getMaritimeShipmentById(id).subscribe({
      next: (shipment) => {
        this.form.patchValue({
          productType: shipment.productType,
          quantity: Number(shipment.quantity),
          originPort_id: shipment.originPort.id ?? 0,
          destinationPort_id: shipment.destinationPort?.id ?? 0,
          registrationDate: shipment.registrationDate,
          deliveryDate: shipment.deliveryDate,
          client_id: Number(shipment.client.id),
          shippingCost: String(Number(shipment.shippingCost)),
          discountRate: Number(shipment.discountRate),
          totalCost: Number(shipment.totalCost),
          guideNumber: shipment.guideNumber,
          fleetNumber: shipment.fleetNumber,
          status: shipment.status,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el envio marítimo para editar.');
        this.loading.set(false);
      },
    });
  }

  // Valida y persiste create/update con manejo de timeout/errores HTTP.
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
      ? this.MaritimeShipmentService.updateMaritimeShipment(this.editShipmentId()!, payload)
      : this.MaritimeShipmentService.createMaritimeShipment(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (shipment) => {
          if (!this.isEditMode()) {
            this.form.reset({
              productType: '',
              quantity: 0,
              originBodega_id: 0,
              destinationBodega_id: 0,
              originPort_id: 0,
              destinationPort_id: 0,
              registrationDate: '',
              deliveryDate: '',
              client_id: 0,
              shippingCost: '',
              discountRate: 0,
              totalCost: 0,
              guideNumber: '',
              fleetNumber: '',
              status: '',
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
              this.error.set('Error al guardar el envio marítimo.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al guardar el envio marítimo.');
          }
        },
      });
  }
}
