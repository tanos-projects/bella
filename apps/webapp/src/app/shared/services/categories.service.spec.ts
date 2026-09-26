import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { CategoryDTO } from '../models/categories.model';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let httpMock: HttpTestingController;

  const categories: CategoryDTO[] = [
    { id: '1', code: 'electronique', label: 'Électronique', description: '' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CategoriesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('requests selectable categories and returns them', () => {
      let result: CategoryDTO[] | undefined;
      service.getAll().subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/categories`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('selectable')).toBe('true');
      req.flush(categories);

      expect(result).toEqual(categories);
    });

    it('caches the response and does not issue a second HTTP call for a later subscriber', () => {
      service.getAll().subscribe();
      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/categories`
      );
      req.flush(categories);

      let cached: CategoryDTO[] | undefined;
      service.getAll().subscribe((res) => (cached = res));

      httpMock.expectNone((r) => r.url === `${environment.apiBaseUrl}/categories`);
      expect(cached).toEqual(categories);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getAll().subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/categories`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('getTop', () => {
    it('requests the top categories', () => {
      let result: CategoryDTO[] | undefined;
      service.getTop().subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/categories/top`);
      expect(req.request.method).toBe('GET');
      req.flush(categories);

      expect(result).toEqual(categories);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getTop().subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/categories/top`);
      req.flush('boom', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });
});
