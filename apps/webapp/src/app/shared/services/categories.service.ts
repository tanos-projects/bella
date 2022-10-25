import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CategoryDTO } from '../models/categories.model';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  getAll(): Observable<CategoryDTO[]> {
    const params = new HttpParams().set('selectable', String(true));
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/categories`, { params });
  }

  getTop(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/categories/top`);
  }
}
