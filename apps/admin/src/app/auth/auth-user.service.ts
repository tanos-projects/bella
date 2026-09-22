import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable()
export class AuthUserService {
  private http = inject(HttpClient);

  private baseUrl = environment.apiBaseUrl;
}
