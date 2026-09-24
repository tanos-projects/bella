import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AdDTO, CreateAdDTO } from '../models/ads.model';
import { CategoryDTO } from '../models/categories.model';
import { SearchFilter } from '../models/search-filter.model';
import { AdsService } from './ads.service';
import { CategoriesService } from './categories.service';
import { UserSettingsService } from './user-settings.service';

describe('AdsService', () => {
  let service: AdsService;
  let httpMock: HttpTestingController;

  const categories: CategoryDTO[] = [
    { id: '1', code: 'electronique', label: 'Électronique', description: '' },
  ];

  const userSettingsServiceStub = { getCountry: jest.fn(() => 'CI') };
  const categoriesServiceStub = { getAll: jest.fn(() => of(categories)) };

  const buildAd = (overrides: Partial<AdDTO> = {}): AdDTO => ({
    id: '1',
    category: 'electronique',
    description: 'd',
    price: 10,
    title: 't',
    quality: 'GOOD',
    ...overrides,
  });

  beforeEach(() => {
    userSettingsServiceStub.getCountry.mockClear().mockReturnValue('CI');
    categoriesServiceStub.getAll.mockClear().mockReturnValue(of(categories));

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: UserSettingsService, useValue: userSettingsServiceStub },
        { provide: CategoriesService, useValue: categoriesServiceStub },
      ],
    });
    service = TestBed.inject(AdsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('requests publications filtered by category and current country', () => {
      const ads = [buildAd()];
      let result: AdDTO[] | undefined;
      service.getAll('electronique').subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('category')).toBe('electronique');
      expect(req.request.params.get('country')).toBe('CI');
      req.flush(ads);

      expect(result).toEqual(ads);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getAll('electronique').subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('getPublishedOne', () => {
    it('fetches the published ad and resolves its category label', () => {
      const ad = buildAd({ id: '1' });
      let result: AdDTO | undefined;
      service.getPublishedOne('1').subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/published/1`
      );
      expect(req.request.method).toBe('GET');
      req.flush(ad);

      expect(result?.category).toBe('Électronique');
      expect(categoriesServiceStub.getAll).toHaveBeenCalled();
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getPublishedOne('1').subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/published/1`
      );
      req.flush('not found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  describe('getUnpublishedOne', () => {
    it('fetches the unpublished ad and resolves its category label', () => {
      const ad = buildAd({ id: '2' });
      let result: AdDTO | undefined;
      service.getUnpublishedOne('2').subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/unpublished/2`
      );
      expect(req.request.method).toBe('GET');
      req.flush(ad);

      expect(result?.category).toBe('Électronique');
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.getUnpublishedOne('2').subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/unpublished/2`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('getMostRecentAdsByCategory', () => {
    it('requests up to 10 recent ads for the category and current country', () => {
      let result: AdDTO[] | undefined;
      service
        .getMostRecentAdsByCategory(categories[0])
        .subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications/most-recent`
      );
      expect(req.request.params.get('category')).toBe('electronique');
      expect(req.request.params.get('limit')).toBe('10');
      expect(req.request.params.get('country')).toBe('CI');
      req.flush([]);

      expect(result).toEqual([]);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service
        .getMostRecentAdsByCategory(categories[0])
        .subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications/most-recent`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('create', () => {
    const payload: CreateAdDTO = {
      category: 'electronique',
      description: 'd',
      price: 5,
      title: 't',
      quality: 'GOOD',
    };

    it('posts the payload and returns the created ad', () => {
      // AdDTO.country is a string (the country code) while CreateAdDTO.country
      // is a full CountryDTO — the create payload has no country set here, so
      // strip its (incompatible) type before merging into an AdDTO fixture.
      const created = buildAd({
        id: '3',
        ...(payload as Omit<CreateAdDTO, 'country'>),
      });
      let result: AdDTO | undefined;
      service.create(payload).subscribe((res) => (result = res));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/publications`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(created);

      expect(result).toEqual(created);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.create(payload).subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/publications`);
      req.flush('boom', { status: 400, statusText: 'Bad Request' });

      expect(error?.status).toBe(400);
    });
  });

  describe('search', () => {
    it('wraps the matching records in a paginated result', () => {
      const filter: SearchFilter = { country: 'CI', category: 'electronique' };
      const ads = [buildAd()];
      let result: { records: AdDTO[]; metadata: { totalCount: number } } | undefined;
      service.search(filter).subscribe((res) => (result = res as any));

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications`
      );
      expect(req.request.params.get('country')).toBe('CI');
      expect(req.request.params.get('category')).toBe('electronique');
      req.flush(ads);

      expect(result?.records).toEqual(ads);
      expect(result?.metadata.totalCount).toBe(1);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service.search({ country: 'CI' }).subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        (r) => r.url === `${environment.apiBaseUrl}/publications`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });

  describe('caller-scoped publication lists', () => {
    it('getMySubmittedPublications requests the "submitted" status', () => {
      let result: AdDTO[] | undefined;
      service.getMySubmittedPublications().subscribe((res) => (result = res));

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/my-publications/submitted`
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);

      expect(result).toEqual([]);
    });

    it('getMyPublishedPublications requests the "published" status', () => {
      service.getMyPublishedPublications().subscribe();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/my-publications/published`
      );
      req.flush([]);
    });

    it('getMyDraftPublications requests the "draft" status', () => {
      service.getMyDraftPublications().subscribe();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/my-publications/draft`
      );
      req.flush([]);
    });

    it('propagates an HTTP error', () => {
      let error: { status: number } | undefined;
      service
        .getMySubmittedPublications()
        .subscribe({ error: (err) => (error = err) });

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/my-publications/submitted`
      );
      req.flush('boom', { status: 500, statusText: 'Internal Server Error' });

      expect(error?.status).toBe(500);
    });
  });
});
