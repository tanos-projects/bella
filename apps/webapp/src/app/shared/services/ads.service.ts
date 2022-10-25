import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AdDTO, CreateAdDTO } from '../models/ads.model';
import { CategoryDTO } from '../models/categories.model';
import { SearchFilter } from '../models/search-filter.model';
import { PaginatedResult } from '../models/search.model';
import { UserSettingsService } from './user-settings.service';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private baseUrl = environment.apiBaseUrl;
  private readonly maxMostRecentAds = 10;
  constructor(private http: HttpClient, private userSettingsService: UserSettingsService) {}

  getAll(categoryCode: string): Observable<AdDTO[]> {
    const params = new HttpParams().set('category', categoryCode).set('country', this.userSettingsService.getCountry());
    return this.http.get<AdDTO[]>(`${this.baseUrl}/ads`, { params });
  }

  getOne(id: string): Observable<AdDTO> {
    return this.http.get<AdDTO>(`${this.baseUrl}/ads/${id}`);
  }

  getMostRecentAdsByCategory(category: CategoryDTO): Observable<AdDTO[]> {
    const params = new HttpParams()
      .set('category', category.code)
      .set('limit', this.maxMostRecentAds)
      .set('country', this.userSettingsService.getCountry());
    return this.http.get<AdDTO[]>(`${this.baseUrl}/ads/most-recent`, { params });
  }

  create(payload: CreateAdDTO): Observable<AdDTO> {
    return this.http.post<AdDTO>(`${this.baseUrl}/ads`, payload);
  }

  search(filter: SearchFilter): Observable<PaginatedResult<AdDTO>> {
    const params = new HttpParams({ fromObject: { ...filter } });
    // return this.http.get<PaginatedResult<AdDTO>>(`${this.baseUrl}/ads`, { params });
    return this.http
      .get<AdDTO[]>(`${this.baseUrl}/ads`, { params })
      .pipe(
        map(
          (records) =>
            ({
              records,
              metadata: {
                page: 0,
                perPage: 20,
                pageCount: 1,
                totalCount: records.length
              }
            } as PaginatedResult<AdDTO>)
        )
      );
  }
}
