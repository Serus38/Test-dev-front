import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { TerrestrialShipment, type IdReference } from '../terrestrial-shipment';

export type TerrestrialShipmentUpsertInput = Omit<
  TerrestrialShipment,
  'id' | 'discountRate' | 'totalCost' | 'guideNumber'
>;

@Injectable({
  providedIn: 'root',
})
export class TerrestrialShipmentService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8081/terrestrial-shipment';

  getTerrestrialShipmentList(): Observable<TerrestrialShipment[]> {
    return this.http.get<TerrestrialShipment[]>(`${this.api}/getAll`);
  }

  createTerrestrialShipment(shipment: TerrestrialShipmentUpsertInput): Observable<TerrestrialShipment> {
    return this.http.post<TerrestrialShipment>(`${this.api}/save`, shipment);
  }

  deleteTerrestrialShipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  getTerrestrialShipmentById(id: number): Observable<TerrestrialShipment> {
    return this.http.get<TerrestrialShipment>(`${this.api}/get/${id}`);
  }

  updateTerrestrialShipment(id: number, shipment: TerrestrialShipmentUpsertInput): Observable<TerrestrialShipment> {
    return this.http.put<TerrestrialShipment>(`${this.api}/edit/${id}`, shipment);
  }
}

export { TerrestrialShipment };
