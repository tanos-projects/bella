import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthUser } from './auth-user.model';

interface CheckProfileResponse {
  hasProfile: boolean;
}

@Injectable()
export class AuthUserService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  isProfileCompletionNeeded(): Observable<boolean> {
    return this.http
      .get<CheckProfileResponse>(`${this.baseUrl}/users/check`)
      .pipe(map((response) => !response.hasProfile));
  }

  getProfile(): Observable<AuthUser> {
    return this.http.get<AuthUser>(`${this.baseUrl}/users/profile`);
  }

  createProfile(create: AuthUser): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/users/profile`, create);
  }

  updateProfile(update: AuthUser): Observable<AuthUser> {
    return this.http.patch<AuthUser>(`${this.baseUrl}/users/profile`, update);
  }

  deleteProfile(): Observable<AuthUser> {
    return this.http.delete<AuthUser>(`${this.baseUrl}/users/profile`);
  }
}
