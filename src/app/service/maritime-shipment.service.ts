import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MaritimeShipment } from '../maritime-shipment';

@Injectable({
  providedIn: 'root',
})
export class MaritimeShipmentService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8081/maritime-shipment';

  getMaritimeShipmentList(): Observable<MaritimeShipment[]> {
    return this.http.get<MaritimeShipment[]>(`${this.api}/getAll`);
  }

  createMaritimeShipment(shipment: Omit<MaritimeShipment, 'id'>): Observable<MaritimeShipment> {
    return this.http.post<MaritimeShipment>(`${this.api}/save`, shipment);
  }

  deleteMaritimeShipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  getMaritimeShipmentById(id: number): Observable<MaritimeShipment> {
    return this.http.get<MaritimeShipment>(`${this.api}/get/${id}`);
  }

  updateMaritimeShipment(id: number, shipment: Omit<MaritimeShipment, 'id'>): Observable<MaritimeShipment> {
    return this.http.put<MaritimeShipment>(`${this.api}/edit/${id}`, shipment);
  }
}

export { MaritimeShipment };
