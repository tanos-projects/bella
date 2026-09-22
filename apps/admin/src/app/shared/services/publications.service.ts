import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AdDTO } from '@bella/dtos';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminPublicationsService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getUnplished(): Observable<AdDTO[]> {
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications/unpublished`);
  }

  approve(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/publications/unpublished/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/publications/${id}/reject`, { reason });
  }

  archive(id: string, reason: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/publications/${id}/archive`, { reason });
  }
}
