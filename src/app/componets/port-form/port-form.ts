import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { PortService, type Port } from '../../service/port.service';

type CreatePortInput = Parameters<PortService['createPort']>[0];

@Component({
  selector: 'app-port-form',
  imports: [ReactiveFormsModule],
  templateUrl: './port-form.html',
  styleUrl: './port-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortForm implements OnInit {
  private readonly portService = inject(PortService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly portCreated = output<Port>();
  readonly isEditMode = signal(false);
  readonly editPortId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    country: ['', [Validators.required, Validators.minLength(3)]],
    city: ['', [Validators.required, Validators.minLength(3)]],
  });

  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const portId = Number(id);
      this.editPortId.set(portId);
      this.isEditMode.set(true);
      this.loadPortData(portId);
    }
  }

  private loadPortData(id: number): void {
    this.loading.set(true);
    this.portService.getPortById(id).subscribe({
      next: (port) => {
        this.form.patchValue({
          name: port.name,
          country: port.country,
          city: port.city,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el puerto para editar.');
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

    const payload: CreatePortInput = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.portService.updatePort(this.editPortId()!, payload)
      : this.portService.createPort(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (port) => {
          if (!this.isEditMode()) {
            this.form.reset({
              name: '',
              country: '',
              city: '',
            });
          }
          this.success.set(true);
          this.portCreated.emit(port);
          setTimeout(() => void this.router.navigate(['/puertos'], { replaceUrl: true }), 800);
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
              this.error.set('Error al guardar el puerto.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al guardar el puerto.');
          }
        },
      });
  }
}
