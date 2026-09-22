import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CategoryDTO } from '../models/categories.model';



export const NO_QUALITY_CATEGORIES = ['services', 'mode-et-beaute', 'sport-et-loisir'];

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  private cachedCategories$: Observable<CategoryDTO[]>;

  getAll(): Observable<CategoryDTO[]> {
    if (!this.cachedCategories$) {
      const params = new HttpParams().set('selectable', String(true));
      this.cachedCategories$ = this.http
        .get<CategoryDTO[]>(`${this.baseUrl}/categories`, { params })
        .pipe(shareReplay(1));
    }
    return this.cachedCategories$;
  }

  getTop(): Observable<CategoryDTO[]> {
    return this.http.get<CategoryDTO[]>(`${this.baseUrl}/categories/top`);
  }
}
