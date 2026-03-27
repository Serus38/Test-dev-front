import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../client';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly http = inject(HttpClient);
  // Endpoint base para operaciones CRUD de clientes.
  private readonly apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');
  private readonly api = `${this.apiBase}/client`;

  // Obtiene el listado completo de clientes.
  getClientList(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api}/getAll`);
  }

  // Crea un cliente nuevo.
  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${this.api}/save`, client);
  }

  // Elimina un cliente por identificador.
  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  // Consulta cliente por id para vista o formulario de edicion.
  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.api}/get/${id}`);
  }

  // Actualiza un cliente existente.
  updateClient(id: number, client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.put<Client>(`${this.api}/edit/${id}`, client);
  }

}
export { Client };

