import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CityDTO } from '../models/city.model';
import { CountryDTO } from '../models/countries.model';
import { CountriesService } from './countries.service';

describe('CountriesService', () => {
  let service: CountriesService;
  let httpMock: HttpTestingController;

  const countries: CountryDTO[] = [
    { id: '1', name: "Côte d'Ivoire", iso2: 'CI', currency: 'XOF' },
  ];
  const cities: CityDTO[] = [
    {
      countryiso2: 'CI',
      stateCode: '',
      state: '',
      provinceCode: '',
      province: '',
      departmentCode: '',
      department: '',
      code: 'abidjan',
      label: 'Abidjan',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CountriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('requests the countries list', () => {
      let result: CountryDTO[] | undefined;
      service.getAll().subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries`);
      expect(req.request.method).toBe('GET');
      req.flush(countries);

      expect(result).toEqual(countries);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getAll().subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries`);
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('getAllDetailed', () => {
    it('requests the detailed countries list', () => {
      let result: CountryDTO[] | undefined;
      service.getAllDetailed().subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries/detailed`);
      expect(req.request.method).toBe('GET');
      req.flush(countries);

      expect(result).toEqual(countries);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getAllDetailed().subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries/detailed`);
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('getCitiesByCountry', () => {
    it('requests the cities for the given country iso2 code', () => {
      let result: CityDTO[] | undefined;
      service.getCitiesByCountry('CI').subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries/CI/cities`);
      expect(req.request.method).toBe('GET');
      req.flush(cities);

      expect(result).toEqual(cities);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getCitiesByCountry('CI').subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/countries/CI/cities`);
      req.flush('not found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });
});
