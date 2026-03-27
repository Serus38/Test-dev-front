import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Port } from '../port';

@Injectable({
  providedIn: 'root',
})
export class PortService {
  private readonly http = inject(HttpClient);
  // Endpoint base para operaciones CRUD de puertos.
  private readonly api = 'http://localhost:8081/port';

  // Obtiene todos los puertos.
  getPortList(): Observable<Port[]> {
    return this.http.get<Port[]>(`${this.api}/getAll`);
  }

  // Crea un puerto.
  createPort(port: Omit<Port, 'id'>): Observable<Port> {
    return this.http.post<Port>(`${this.api}/save`, port);
  }

  // Elimina un puerto por id.
  deletePort(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  // Obtiene un puerto por id.
  getPortById(id: number): Observable<Port> {
    return this.http.get<Port>(`${this.api}/get/${id}`);
  }

  // Actualiza la informacion de un puerto.
  updatePort(id: number, port: Omit<Port, 'id'>): Observable<Port> {
    return this.http.put<Port>(`${this.api}/edit/${id}`, port);
  }
}

export { Port };
