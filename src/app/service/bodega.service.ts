import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Bodega } from '../bodega';

@Injectable({
  providedIn: 'root',
})
export class BodegaService {
  private readonly http = inject(HttpClient);
  private readonly api = 'http://localhost:8081/bodega';

  getBodegaList(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(`${this.api}/getAll`);
  }

  createBodega(bodega: Omit<Bodega, 'id'>): Observable<Bodega> {
    return this.http.post<Bodega>(`${this.api}/save`, bodega);
  }

  deleteBodega(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/delete/${id}`);
  }

  getBodegaById(id: number): Observable<Bodega> {
    return this.http.get<Bodega>(`${this.api}/get/${id}`);
  }

  updateBodega(id: number, bodega: Omit<Bodega, 'id'>): Observable<Bodega> {
    return this.http.put<Bodega>(`${this.api}/edit/${id}`, bodega);
  }
}

export { Bodega };
