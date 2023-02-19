import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AdDTO } from '@bella/dtos';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminPublicationsService {
  private readonly baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

  getUnplished(): Observable<AdDTO[]> {
    return this.http.get<AdDTO[]>(`${this.baseUrl}/publications/unpublished`);
  }

  approve(id: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/publications/${id}/approve`, {});
  }

  reject(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/publications/${id}/reject`, { reason });
  }

  archive(id: string, reason: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/publications/${id}/archive`, { reason });
  }
}
