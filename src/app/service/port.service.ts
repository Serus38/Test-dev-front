import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Port } from '../port';

@Injectable({
  providedIn: 'root',
})
export class PortService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8081/port';

  getPortList(): Observable<Port[]> {
    return this.http.get<Port[]>(`${this.api}/getAll`);
  }

  createPort(port: Omit<Port, 'id'>): Observable<Port> {
    return this.http.post<Port>(`${this.api}/save`, port);
  }

  deletePort(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  getPortById(id: number): Observable<Port> {
    return this.http.get<Port>(`${this.api}/get/${id}`);
  }

  updatePort(id: number, port: Omit<Port, 'id'>): Observable<Port> {
    return this.http.put<Port>(`${this.api}/edit/${id}`, port);
  }
}

export { Port };
