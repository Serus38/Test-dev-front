import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Client } from '../client';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8081/client';

  getClientList(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.api}/getAll`);
  }

  createClient(client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.post<Client>(`${this.api}/save`, client);
  }

  deleteClient(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  getClientById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.api}/get/${id}`);
  }

  updateClient(id: number, client: Omit<Client, 'id'>): Observable<Client> {
    return this.http.put<Client>(`${this.api}/edit/${id}`, client);
  }

}
export { Client };

