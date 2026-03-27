import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MaritimeShipment } from '../maritime-shipment';


export type MaritimeShipmentUpsertInput = Omit<
  MaritimeShipment,
  'id' | 'discountRate' | 'totalCost' | 'guideNumber'
>;
@Injectable({
  providedIn: 'root',
})
export class MaritimeShipmentService {
  private readonly http = inject(HttpClient);
  // Endpoint base para el modulo de envios maritimos.
  private readonly apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');
  private readonly api = `${this.apiBase}/maritime-shipment`;

  // Lista todos los envios maritimos.
  getMaritimeShipmentList(): Observable<MaritimeShipment[]> {
    return this.http.get<MaritimeShipment[]>(`${this.api}/getAll`);
  }

  // Crea un envio maritimo.
  createMaritimeShipment(shipment: MaritimeShipmentUpsertInput): Observable<MaritimeShipment> {
    return this.http.post<MaritimeShipment>(`${this.api}/save`, shipment);
  }

  // Elimina un envio maritimo por id.
  deleteMaritimeShipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  // Busca un envio maritimo para detalle o edicion.
  getMaritimeShipmentById(id: number): Observable<MaritimeShipment> {
    return this.http.get<MaritimeShipment>(`${this.api}/get/${id}`);
  }

  // Actualiza un envio maritimo existente.
  updateMaritimeShipment(id: number, shipment: MaritimeShipmentUpsertInput): Observable<MaritimeShipment> {
    return this.http.put<MaritimeShipment>(`${this.api}/edit/${id}`, shipment);
  }
}

export { MaritimeShipment };
