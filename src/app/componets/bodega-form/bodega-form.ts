import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { BodegaService, type Bodega } from '../../service/bodega.service';

type CreateBodegaInput = Parameters<BodegaService['createBodega']>[0];

@Component({
  selector: 'app-bodega-form',
  imports: [ReactiveFormsModule],
  templateUrl: './bodega-form.html',
  styleUrl: './bodega-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodegaForm implements OnInit {
  private readonly bodegaService = inject(BodegaService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly bodegaCreated = output<Bodega>();
  readonly isEditMode = signal(false);
  readonly editBodegaId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    country: ['', [Validators.required, Validators.minLength(3)]],
    city: ['', [Validators.required, Validators.minLength(3)]],
  });

  // Identifica si se abre en modo edicion segun parametro de ruta.
  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const bodegaId = Number(id);
      this.editBodegaId.set(bodegaId);
      this.isEditMode.set(true);
      this.loadBodegaData(bodegaId);
    }
  }

  // Carga la bodega seleccionada y llena controles del formulario.
  private loadBodegaData(id: number): void {
    this.loading.set(true);
    this.bodegaService.getBodegaById(id).subscribe({
      next: (bodega) => {
        this.form.patchValue({
          name: bodega.name,
          country: bodega.country,
          city: bodega.city,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la bodega para editar.');
        this.loading.set(false);
      },
    });
  }

  // Ejecuta creacion/actualizacion tras validar campos requeridos.
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload: CreateBodegaInput = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.bodegaService.updateBodega(this.editBodegaId()!, payload)
      : this.bodegaService.createBodega(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (bodega) => {
          if (!this.isEditMode()) {
            this.form.reset({
              name: '',
              country: '',
              city: '',
            });
          }
          this.success.set(true);
          this.bodegaCreated.emit(bodega);
          setTimeout(() => void this.router.navigate(['/bodegas'], { replaceUrl: true }), 800);
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
              this.error.set('Error al guardar la bodega.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al guardar la bodega.');
          }
        },
      });
  }
}
