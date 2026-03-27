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
type LocationType = 'TERRESTRE' | 'MARITIMO';

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
  readonly routeValidationError = signal<string | null>(null);
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
    originType: ['TERRESTRE' as LocationType, Validators.required],
    destinationType: ['TERRESTRE' as LocationType, Validators.required],
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
    vehiclePlate: ['',[Validators.required, Validators.pattern(/^[A-Z]{3}\d{4}$/)]],
    status: [''],
  });

  // Inicializa catalogos y modo de formulario (crear/editar).
  ngOnInit(): void {
    this.loadOptions();
    this.setupLocationTypeBehavior();

    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const shipmentId = Number(id);
      this.editShipmentId.set(shipmentId);
      this.isEditMode.set(true);
      this.loadShipmentData(shipmentId);
    } else {
      this.applyLocationRules();
    }
  }

  // Reacciona a cambios de tipo de origen/destino para aplicar reglas de ruta.
  private setupLocationTypeBehavior(): void {
    this.form.controls.originType.valueChanges.subscribe(() => this.applyLocationRules());
    this.form.controls.destinationType.valueChanges.subscribe(() => this.applyLocationRules());
  }

  // Habilita/deshabilita controles segun tipo de ubicacion y valida ruta.
  private applyLocationRules(): void {
    const originType = this.form.controls.originType.value;
    const destinationType = this.form.controls.destinationType.value;

    if (originType === 'TERRESTRE') {
      this.form.controls.originBodega_id.enable({ emitEvent: false });
      this.form.controls.originPort_id.disable({ emitEvent: false });
      this.form.patchValue({ originPort_id: 0 }, { emitEvent: false });
    } else {
      this.form.controls.originPort_id.enable({ emitEvent: false });
      this.form.controls.originBodega_id.disable({ emitEvent: false });
      this.form.patchValue({ originBodega_id: 0 }, { emitEvent: false });
    }

    if (destinationType === 'TERRESTRE') {
      this.form.controls.destinationBodega_id.enable({ emitEvent: false });
      this.form.controls.destinationPort_id.disable({ emitEvent: false });
      this.form.patchValue({ destinationPort_id: 0 }, { emitEvent: false });
    } else {
      this.form.controls.destinationPort_id.enable({ emitEvent: false });
      this.form.controls.destinationBodega_id.disable({ emitEvent: false });
      this.form.patchValue({ destinationBodega_id: 0 }, { emitEvent: false });
    }

    if (originType === 'MARITIMO' && destinationType === 'MARITIMO') {
      this.routeValidationError.set('No se permite Puerto -> Puerto en envio terrestre. Esa ruta corresponde a envio maritimo.');
    } else {
      this.routeValidationError.set(null);
    }
  }

  // Adapta el formulario al payload esperado por el backend.
  private toPayload(): CreateTerrestrialShipmentInput {
    const raw = this.form.getRawValue();
    const {
      discountRate: _discountRate,
      totalCost: _totalCost,
      guideNumber: _guideNumber,
      originType,
      destinationType,
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
      originBodega: originType === 'TERRESTRE' && originBodega_id ? { id: Number(originBodega_id) } : null,
      destinationBodega:
        destinationType === 'TERRESTRE' && destinationBodega_id ? { id: Number(destinationBodega_id) } : null,
      originPort: originType === 'MARITIMO' && originPort_id ? { id: Number(originPort_id) } : null,
      destinationPort:
        destinationType === 'MARITIMO' && destinationPort_id ? { id: Number(destinationPort_id) } : null,
      registrationDate: rest.registrationDate,
      deliveryDate: rest.deliveryDate,
      client: { id: Number(client_id) },
      shippingCost: Number(raw.shippingCost),
      vehiclePlate: rest.vehiclePlate,
      status: rest.status,
    } as CreateTerrestrialShipmentInput;
  }

  // Carga catalogos usados por los selects del formulario.
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

  // Carga el envio en edicion y restablece reglas de ubicacion.
  private loadShipmentData(id: number): void {
    this.loading.set(true);
    this.terrestrialShipmentService.getTerrestrialShipmentById(id).subscribe({
      next: (shipment) => {
        const originType: LocationType = shipment.originPort?.id ? 'MARITIMO' : 'TERRESTRE';
        const destinationType: LocationType = shipment.destinationPort?.id ? 'MARITIMO' : 'TERRESTRE';

        this.form.patchValue({
          productType: shipment.productType,
          quantity: Number(shipment.quantity),
          originType,
          destinationType,
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
        this.applyLocationRules();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el envio terrestre para editar.');
        this.loading.set(false);
      },
    });
  }

  // Valida reglas de negocio y persiste create/update del envio.
  onSubmit(): void {
    if (this.form.controls.originType.value === 'MARITIMO' && this.form.controls.destinationType.value === 'MARITIMO') {
      this.routeValidationError.set('No se permite Puerto -> Puerto en envio terrestre. Esa ruta corresponde a envio maritimo.');
      return;
    }

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
              originType: 'TERRESTRE',
              destinationType: 'TERRESTRE',
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
            this.applyLocationRules();
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

  // Formatea input monetario y conserva valor numerico en el control.
  onShippingCostInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value ?? '').replace(/\D/g, '');

    if (!digits) {
      this.form.controls.shippingCost.setValue(0, { emitEvent: false });
      input.value = '';
      return;
    }

    const numericValue = Number(digits);
    this.form.controls.shippingCost.setValue(numericValue, { emitEvent: false });
    input.value = new Intl.NumberFormat('es-CO').format(numericValue);
  }
}
