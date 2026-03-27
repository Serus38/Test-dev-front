import { ChangeDetectionStrategy, Component, inject, signal, output, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, ActivatedRoute } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { ClientService, type Client } from '../../service/client.service';

type CreateClientInput = Parameters<ClientService['createClient']>[0];

@Component({
  selector: 'app-client-form',
  imports: [ReactiveFormsModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientForm implements OnInit {
  private readonly clientService = inject(ClientService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly clientCreated = output<Client>();
  readonly isEditMode = signal(false);
  readonly editClientId = signal<number | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
  });

  // Detecta si la ruta trae id para activar modo edicion.
  ngOnInit(): void {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    if (id) {
      const clientId = Number(id);
      this.editClientId.set(clientId);
      this.isEditMode.set(true);
      this.loadClientData(clientId);
    }
  }

  // Carga datos del cliente seleccionado y rellena el formulario.
  private loadClientData(id: number): void {
    this.loading.set(true);
    this.clientService.getClientById(id).subscribe({
      next: (client) => {
        this.form.patchValue({
          name: client.name,
          email: client.email,
          phone: client.phone,
          address: client.address,
        });
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el cliente para editar.');
        this.loading.set(false);
      },
    });
  }

  // Valida, construye payload y ejecuta create/update segun modo.
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.success.set(false);

    const payload: CreateClientInput = this.form.getRawValue();

    const request$ = this.isEditMode()
      ? this.clientService.updateClient(this.editClientId()!, payload)
      : this.clientService.createClient(payload);

    request$
      .pipe(
        timeout(15000),
        finalize(() => this.loading.set(false))
      )
      .subscribe({
        next: (client) => {
          if (!this.isEditMode()) {
            this.form.reset({
              name: '',
              email: '',
              phone: '',
              address: '',
            });
          }
          this.success.set(true);
          this.clientCreated.emit(client);
          setTimeout(() => void this.router.navigate(['/'], { replaceUrl: true }), 800);
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
              this.error.set('Error al crear el cliente.');
            }
            return;
          }

          if (err.name === 'TimeoutError') {
            this.error.set('El servidor tardó demasiado en responder.');
          } else {
            this.error.set('Error inesperado al crear el cliente.');
          }
        },
      });
  }
}