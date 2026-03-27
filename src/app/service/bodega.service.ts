import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Bodega } from '../bodega';

@Injectable({
  providedIn: 'root',
})
export class BodegaService {
  private readonly http = inject(HttpClient);
  // Endpoint base para operaciones de bodegas.
  private readonly api = 'http://localhost:8081/bodega';

  // Obtiene todas las bodegas registradas.
  getBodegaList(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.api}/getAll`);
  }

  // Crea una nueva bodega.
  createBodega(bodega: Omit<Bodega, 'id'>): Observable<Bodega> {
    return this.http.post<Bodega>(`${this.api}/save`, bodega);
  }

  // Elimina una bodega por id.
  deleteBodega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  // Consulta una bodega puntual para detalle/edicion.
  getBodegaById(id: number): Observable<Bodega> {
    return this.http.get<Bodega>(`${this.api}/get/${id}`);
  }

  // Actualiza una bodega existente.
  updateBodega(id: number, bodega: Omit<Bodega, 'id'>): Observable<Bodega> {
    return this.http.put<Bodega>(`${this.api}/edit/${id}`, bodega);
  }
}

export { Bodega };
