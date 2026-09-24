import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { AdDTO } from '../models/ads.model';
import { CategoryDTO } from '../models/categories.model';
import { CityDTO } from '../models/city.model';
import { CodeLabel } from '../models/code-label.model';
import { CountryDTO } from '../models/countries.model';
import { PaginatedResult } from '../models/search.model';
import { AdsService } from './ads.service';
import { CategoriesService } from './categories.service';
import { CountriesService } from './countries.service';
import { QualitiesService } from './qualities.service';
import { SearchService } from './search.service';
import { UserSettingsService } from './user-settings.service';

// SearchService itself performs no HTTP call: it orchestrates AdsService,
// CountriesService, CategoriesService and QualitiesService, all of which are
// mocked here rather than pulled in with HttpClientTestingModule, so the
// "HTTP error" case the phase requires is exercised through the error an
// upstream service (AdsService.search) raises, which is the real failure
// mode this service has to deal with.
describe('SearchService', () => {
  let service: SearchService;
  let adsServiceStub: { search: jest.Mock };

  const countries: CountryDTO[] = [
    { id: '1', name: "Côte d'Ivoire", iso2: 'CI', currency: 'XOF' },
  ];
  const categories: CategoryDTO[] = [
    { id: '1', code: 'electronique', label: 'Électronique', description: '' },
  ];
  const qualities: CodeLabel[] = [{ code: 'GOOD', label: 'Bon' }];
  const cities: CityDTO[] = [];

  beforeEach(() => {
    adsServiceStub = {
      search: jest.fn(() => of({ records: [] } as PaginatedResult<AdDTO>)),
    };

    TestBed.configureTestingModule({
      providers: [
        SearchService,
        { provide: AdsService, useValue: adsServiceStub },
        {
          provide: UserSettingsService,
          useValue: {
            country$: new BehaviorSubject<string>('CI'),
            getCountry: jest.fn(() => 'CI'),
          },
        },
        {
          provide: CountriesService,
          useValue: {
            getAll: jest.fn(() => of(countries)),
            getCitiesByCountry: jest.fn(() => of(cities)),
          },
        },
        {
          provide: CategoriesService,
          useValue: { getAll: jest.fn(() => of(categories)) },
        },
        {
          provide: QualitiesService,
          useValue: { getAll: jest.fn(() => of(qualities)) },
        },
      ],
    });
    service = TestBed.inject(SearchService);
  });

  describe('searchFromFilter', () => {
    it('delegates to AdsService.search and republishes the result on searchResults$', () => {
      const result: PaginatedResult<AdDTO> = {
        records: [
          {
            id: '1',
            category: 'electronique',
            description: '',
            price: 1,
            title: 't',
            quality: 'GOOD',
          },
        ],
      };
      adsServiceStub.search.mockReturnValue(of(result));

      let emitted: PaginatedResult<AdDTO> | undefined;
      service
        .searchFromFilter({ country: 'CI', category: 'electronique' })
        .subscribe((res) => (emitted = res));

      expect(emitted).toEqual(result);
      expect(adsServiceStub.search).toHaveBeenCalledWith({
        country: 'CI',
        category: 'electronique',
      });

      let latest: PaginatedResult<AdDTO> | undefined;
      service.searchResults$.subscribe((res) => (latest = res));
      expect(latest).toEqual(result);
    });

    it('defaults the country to the current user setting when missing from the filter', () => {
      service
        .searchFromFilter({ category: 'electronique' } as any)
        .subscribe();

      expect(adsServiceStub.search).toHaveBeenCalledWith({
        country: 'CI',
        category: 'electronique',
      });
    });

    it('propagates an error raised by AdsService.search without touching searchResults$', () => {
      let before: PaginatedResult<AdDTO> | undefined;
      service.searchResults$.subscribe((res) => (before = res));
      expect(before).toEqual({ records: [] });

      adsServiceStub.search.mockReturnValue(
        throwError(() => ({ status: 500 }))
      );

      let error: { status: number } | undefined;
      service
        .searchFromFilter({ country: 'CI' })
        .subscribe({ error: (err) => (error = err) });

      expect(error?.status).toBe(500);

      let after: PaginatedResult<AdDTO> | undefined;
      service.searchResults$.subscribe((res) => (after = res));
      expect(after).toEqual({ records: [] });
    });
  });

  describe('silentSearchCount$', () => {
    it('stays quiet until silent search is enabled, then emits the record count', () => {
      adsServiceStub.search.mockReturnValue(
        of({ records: [{ id: '1' }, { id: '2' }] } as unknown as PaginatedResult<AdDTO>)
      );

      let count: number | undefined;
      service.silentSearchCount$.subscribe((c) => (count = c));
      expect(count).toBeUndefined();

      service.enableSilentSearch();

      expect(count).toBe(2);
    });
  });

  describe('reset', () => {
    it('reinitialises the filter to just the current country', () => {
      service.reset();

      let filter: unknown;
      service.currentSearchFilter$.subscribe((f) => (filter = f));

      expect(filter).toEqual({ country: 'CI' });
    });
  });
});
