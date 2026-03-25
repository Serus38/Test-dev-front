import { ChangeDetectionStrategy, Component, OnInit, DestroyRef, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { BodegaService, type Bodega } from '../../service/bodega.service';
import { ClientService, type Client } from '../../service/client.service';
import { PortService, type Port } from '../../service/port.service';
import {
  TerrestrialShipmentService,
  type TerrestrialShipment,
  type TerrestrialShipmentUpsertInput,
} from '../../service/terrestrial-shipment.service';

type CreateTerrestrialShipmentInput = TerrestrialShipmentUpsertInput;

@Component({
  selector: 'app-terrestrial-shipment-form',
  imports: [ReactiveFormsModule],
  templateUrl: './terrestrial-shipment-form.html',
  styleUrl: './terrestrial-shipment-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerrestrialShipmentForm implements OnInit {
  private readonly terrestrialShipmentService = inject(TerrestrialShipmentService);
  private readonly clientService = inject(ClientService);
  private readonly bodegaService = inject(BodegaService);
  private readonly portService = inject(PortService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly shipmentCreated = output<TerrestrialShipment>();
  readonly isEditMode = signal(false);
  readonly editShipmentId = signal<number | null>(null);
  readonly clients = signal<Client[]>([]);
  readonly bodegas = signal<Bodega[]>([]);
  readonly ports = signal<Port[]>([]);

  readonly form = this.fb.nonNullable.group({
    productType: ['', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    originBodega_id: [0],
    destinationBodega_id: [0],
    originPort_id: [0],
    destinationPort_id: [0],
    registrationDate: ['', Validators.required],
    deliveryDate: ['', Validators.required],
    client_id: [0, [Validators.required, Validators.min(1)]],
    shippingCost: [0, [Validators.required, Validators.min(0)]],
    discountRate: [0],
    totalCost: [0],
    guideNumber: [''],
    vehiclePlate: [''],
    status: [''],
  });

  private toPayload(): CreateTerrestrialShipmentInput {
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
      vehiclePlate: rest.vehiclePlate,
      status: rest.status,
    } as CreateTerrestrialShipmentInput;
  }

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

  private loadOptions(): void {
    this.clientService.getClientList().subscribe({
      next: (clients) => this.clients.set(clients),
      error: () => this.error.set('No se pudo cargar la lista de clientes.'),
    });

    this.bodegaService.getBodegaList().subscribe({
      next: (bodegas) => this.bodegas.set(bodegas),
      error: () => this.error.set('No se pudo cargar la lista de bodegas.'),
    });

    this.portService.getPortList().subscribe({
      next: (ports) => this.ports.set(ports),
      error: () => this.error.set('No se pudo cargar la lista de puertos.'),
    });
  }


  private loadShipmentData(id: number): void {
    this.loading.set(true);
    this.terrestrialShipmentService.getTerrestrialShipmentById(id).subscribe({
      next: (shipment) => {
        this.form.patchValue({
          productType: shipment.productType,
          quantity: Number(shipment.quantity),
          originBodega_id: shipment.originBodega?.id ?? 0,
          destinationBodega_id: shipment.destinationBodega?.id ?? 0,
          originPort_id: shipment.originPort?.id ?? 0,
          destinationPort_id: shipment.destinationPort?.id ?? 0,
          registrationDate: shipment.registrationDate,
          deliveryDate: shipment.deliveryDate,
          client_id: Number(shipment.client.id),
          shippingCost: Number(shipment.shippingCost),
          discountRate: Number(shipment.discountRate),
          totalCost: Number(shipment.totalCost),
          guideNumber: shipment.guideNumber,
          vehiclePlate: shipment.vehiclePlate,
          status: shipment.status,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el envio terrestre para editar.');
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
      ? this.terrestrialShipmentService.updateTerrestrialShipment(this.editShipmentId()!, payload)
      : this.terrestrialShipmentService.createTerrestrialShipment(payload);

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
              shippingCost: 0,
              discountRate: 0,
              totalCost: 0,
              guideNumber: '',
              vehiclePlate: '',
              status: '',
            });
          }
          this.success.set(true);
          this.shipmentCreated.emit(shipment);
          setTimeout(() => void this.router.navigate(['/terrestrial_shipments'], { replaceUrl: true }), 800);
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
              this.error.set('Error al guardar el envio terrestre.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al guardar el envio terrestre.');
          }
        },
      });
  }
}
