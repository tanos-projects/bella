import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import {
  concatMap,
  map,
  skipWhile,
  switchMap,
  take,
  tap,
} from 'rxjs/operators';

import { AdDTO } from '../models/ads.model';
import { SearchFilter } from '../models/search-filter.model';
import { PaginatedResult } from '../models/search.model';
import { AdsService } from './ads.service';
import { CategoriesService } from './categories.service';
import { CountriesService } from './countries.service';
import { QualitiesService } from './qualities.service';
import { UserSettingsService } from './user-settings.service';

export function removeEmpty(obj: any): any {
  return Object.entries(obj)
    .filter(([_, v]) => v !== null && v !== '')
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private _currentSearchFilter$ = new BehaviorSubject<SearchFilter>(
    this.getInitialFilter()
  );
  currentSearchFilter$ = this._currentSearchFilter$.asObservable();

  private _currentSilentSearchFilter$ = new BehaviorSubject<SearchFilter>(
    this.getInitialFilter()
  );
  currentSilentSearchFilter$ = this._currentSilentSearchFilter$.asObservable();

  silentSearchCount$ = this._currentSilentSearchFilter$.pipe(
    skipWhile(() => !this.silentSearchEnabled),
    switchMap((filter) =>
      this.adsService.search(removeEmpty(filter)).pipe(
        map((response) => {
          return response?.records?.length || 0;
        })
      )
    )
  );

  private _isSearchPage$ = new BehaviorSubject<boolean>(false);
  isSearchPage$ = this._isSearchPage$.asObservable();

  private _searchResults$ = new BehaviorSubject<PaginatedResult<AdDTO>>({
    records: [],
  });
  searchResults$ = this._searchResults$.asObservable();

  // Referential data
  countries$ = this.countriesService.getAll();
  categories$ = this.categoriesService.getAll();
  qualities$ = this.qualitiesService.getAll();
  countryCities$ = this._currentSilentSearchFilter$.pipe(
    concatMap((filter) => {
      console.log('Filter change : ', filter);
      return this.countriesService.getCitiesByCountry(filter.country);
    })
  );
  private silentSearchEnabled = false;

  constructor(
    private userSettingsService: UserSettingsService,
    private adsService: AdsService,
    private countriesService: CountriesService,
    private categoriesService: CategoriesService,
    private qualitiesService: QualitiesService
  ) {
    this.userSettingsService.country$.subscribe(() => this.reset());

    this._currentSilentSearchFilter$
      .pipe(tap((filter) => console.log('cities ', filter)))
      .subscribe();
  }

  enableSilentSearch(): void {
    this.silentSearchEnabled = true;
    this.updateFilterForSilentSearch(this._currentSearchFilter$.value);
  }

  disableSilentSearch(): void {
    this.silentSearchEnabled = false;
  }

  updateFilterForSilentSearch(filter: SearchFilter): void {
    this._currentSilentSearchFilter$.next(filter);
  }

  search(): Observable<PaginatedResult<AdDTO>> {
    return this.currentSearchFilter$.pipe(
      switchMap((filter) => this.adsService.search(removeEmpty(filter))),
      tap((result) => this._searchResults$.next(result)),
      take(1)
    );
  }

  searchFromFilter(filter: SearchFilter): Observable<PaginatedResult<AdDTO>> {
    filter = { ...filter };
    if (!filter?.country) {
      filter = {
        ...filter,
        country: this.userSettingsService.getCountry(),
      };
    }
    this._currentSearchFilter$.next(filter);
    this._currentSilentSearchFilter$.next(filter);

    return this.adsService
      .search(removeEmpty(filter))
      .pipe(tap((result) => this._searchResults$.next(result)));
  }

  setIsCurrentPageSearch(isSearchPage: boolean): void {
    this._isSearchPage$.next(isSearchPage);
  }

  private getInitialFilter(): SearchFilter {
    return {
      country: this.userSettingsService.getCountry(),
      // quality: 'GOOD'
    };
  }

  reset(): void {
    this._currentSearchFilter$.next(this.getInitialFilter());
  }
}
