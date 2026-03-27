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
  // Endpoint base para el modulo de envios terrestres.
  private readonly apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8081').replace(/\/$/, '');
  private readonly api = `${this.apiBase}/terrestrial-shipment`;

  // Obtiene todos los envios terrestres.
  getTerrestrialShipmentList(): Observable<TerrestrialShipment[]> {
    return this.http.get<TerrestrialShipment[]>(`${this.api}/getAll`);
  }

  // Crea un envio terrestre.
  createTerrestrialShipment(shipment: TerrestrialShipmentUpsertInput): Observable<TerrestrialShipment> {
    return this.http.post<TerrestrialShipment>(`${this.api}/save`, shipment);
  }

  // Elimina un envio terrestre por id.
  deleteTerrestrialShipment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  // Consulta un envio terrestre por id.
  getTerrestrialShipmentById(id: number): Observable<TerrestrialShipment> {
    return this.http.get<TerrestrialShipment>(`${this.api}/get/${id}`);
  }

  // Actualiza un envio terrestre existente.
  updateTerrestrialShipment(id: number, shipment: TerrestrialShipmentUpsertInput): Observable<TerrestrialShipment> {
    return this.http.put<TerrestrialShipment>(`${this.api}/edit/${id}`, shipment);
  }
}

export { TerrestrialShipment };
