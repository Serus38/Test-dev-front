import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ClientService, type Client } from '../../service/client.service';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-client-list',
  imports: [RouterLink],
  templateUrl: './client-list.html',
  styleUrl: './client-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class ClientList {
  private readonly clientService = inject(ClientService);

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.listClients();
  }

  listClients(): void {
    this.loading.set(true);
    this.error.set(null);

    this.clientService.getClientList().subscribe({
      next: (data) => {
        this.clients.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar la lista de clientes desde el backend.');
        }
        this.loading.set(false);
      }
    });
  }

  deleteClient(id: number){
    this.clientService.deleteClient(id).subscribe(
      ()=> this.listClients(),
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo eliminar el cliente.');
        }
      }
    );
  }

  editClient(id: number){
    this.clientService.getClientById(id).subscribe(
      (client) => {
        // Aquí podrías navegar a un formulario de edición pasando el cliente como estado o usando un servicio de estado compartido
      },
      (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('401 Unauthorized: el backend requiere autenticacion (token o credenciales).');
        } else {
          this.error.set('No se pudo cargar el cliente para editar.');
        }
      }
    );
  }
}
