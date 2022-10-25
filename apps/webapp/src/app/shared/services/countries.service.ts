import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CityDTO } from '../models/city.model';
import { CountryDTO } from '../models/countries.model';

@Injectable({ providedIn: 'root' })
export class CountriesService {
  private baseUrl = environment.apiBaseUrl;
  constructor(private http: HttpClient) {}

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
