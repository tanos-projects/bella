import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CityDTO } from '../models/city.model';
import { CountryDTO } from '../models/countries.model';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiBaseUrl;

  getAll(): Observable<CountryDTO[]> {
    return this.http.get<CountryDTO[]>(`${this.baseUrl}/countries`);
  }

  getAllDetailed(): Observable<CountryDTO[]> {
    return this.http.get<CountryDTO[]>(`${this.baseUrl}/countries/detailed`);
  }

  getCitiesByCountry(countryIso2: string): Observable<CityDTO[]> {
    return this.http.get<CityDTO[]>(`${this.baseUrl}/countries/${countryIso2}/cities`);
  }
}
