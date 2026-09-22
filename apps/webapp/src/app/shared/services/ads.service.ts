import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map, withLatestFrom } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AdDTO, CreateAdDTO } from '../models/ads.model';
import { CategoryDTO } from '../models/categories.model';
import { SearchFilter } from '../models/search-filter.model';
import { PaginatedResult } from '../models/search.model';
import { CategoriesService } from './categories.service';
import { UserSettingsService } from './user-settings.service';

@Injectable({ providedIn: 'root' })
export class AdsService {
  private http = inject(HttpClient);
  private userSettingsService = inject(UserSettingsService);
  private categoriesService = inject(CategoriesService);

  private baseUrl = environment.apiBaseUrl;
  private readonly maxMostRecentAds = 10;

  getAll(categoryCode: string): Observable<AdDTO[]> {
    const params = new HttpParams()
      .set('category', categoryCode)
      .set('country', this.userSettingsService.getCountry());
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications`, { params });
  }

  getPublishedOne(id: string): Observable<AdDTO> {
    return this.http.get<AdDTO>(`${this.baseUrl}/publications/published/${id}`).pipe(
      withLatestFrom(this.categoriesService.getAll()),
      map(([ad, categories]) => {
        const adWithCategoryLabel: AdDTO = {
          ...ad,
          category: categories.find(
            (category) => category.code === ad.category
          )?.label ?? ad.category,
        };
        return adWithCategoryLabel;
      })
    );
  }

  getUnpublishedOne(id: string): Observable<AdDTO> {
    return this.http.get<AdDTO>(`${this.baseUrl}/publications/unpublished/${id}`).pipe(
      withLatestFrom(this.categoriesService.getAll()),
      map(([ad, categories]) => {
        const adWithCategoryLabel: AdDTO = {
          ...ad,
          category: categories.find(
            (category) => category.code === ad.category
          )?.label ?? ad.category,
        };
        return adWithCategoryLabel;
      })
    );
  }

  getMostRecentAdsByCategory(category: CategoryDTO): Observable<AdDTO[]> {
    const params = new HttpParams()
      .set('category', category.code)
      .set('limit', this.maxMostRecentAds)
      .set('country', this.userSettingsService.getCountry());
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications/most-recent`, {
      params,
    });
  }

  create(payload: CreateAdDTO): Observable<AdDTO> {
    return this.http.post<AdDTO>(`${this.baseUrl}/publications`, payload);
  }

  search(filter: SearchFilter): Observable<PaginatedResult<AdDTO>> {
    const params = new HttpParams({ fromObject: { ...filter } });
    // return this.http.get<PaginatedResult<AdDTO>>(`${this.baseUrl}/publications`, { params });
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications`, { params }).pipe(
      map(
        (records) =>
          ({
            records,
            metadata: {
              page: 0,
              perPage: 20,
              pageCount: 1,
              totalCount: records.length,
            },
          } as PaginatedResult<AdDTO>)
      )
    );
  }

  getMySubmittedPublications(): Observable<AdDTO[]> {
    return this.getPublicationsByStatus('submitted');
  }

  getMyPublishedPublications(): Observable<AdDTO[]> {
    return this.getPublicationsByStatus('published');
  }

  getMyDraftPublications(): Observable<AdDTO[]> {
    return this.getPublicationsByStatus('draft');
  }

  private getPublicationsByStatus(status: string): Observable<AdDTO[]> {
    const params = new HttpParams();
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications/my-publications/${status}`, { params });
  }
}
