import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

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
  private _currentSearchFilter$ = new BehaviorSubject<SearchFilter>(this.getInitialFilter());

  currentSearchFilter$ = this._currentSearchFilter$.asObservable();

  private _silentSearch$ = new BehaviorSubject<number>(0);
  silentSearchCount$ = this._silentSearch$.asObservable();

  private _isSearchPage$ = new BehaviorSubject<boolean>(false);
  isSearchPage$ = this._isSearchPage$.asObservable();

  private _searchResults$ = new BehaviorSubject<PaginatedResult<AdDTO>>({ records: [] });
  searchResults$ = this._searchResults$.asObservable();

  // Referential data
  countries$ = this.countriesService.getAll();
  categories$ = this.categoriesService.getAll();
  qualities$ = this.qualitiesService.getAll();

  constructor(
    private userSettingsService: UserSettingsService,
    private adsService: AdsService,
    private countriesService: CountriesService,
    private categoriesService: CategoriesService,
    private qualitiesService: QualitiesService
  ) {
    this.userSettingsService.country$.subscribe(() => this.reset());
  }

  updateFilter(filter: SearchFilter): void {
    this.silentSearchFromFilter(filter).subscribe();
  }

  doSilentApproximativeSearchWithCurrentFilter(): void {
    this.currentSearchFilter$
      .pipe(
        switchMap((filter) => this.silentSearchFromFilter(filter)),
        take(1)
      )
      .subscribe();
  }

  private silentSearchFromFilter(filter: SearchFilter): Observable<void> {
    return this.adsService.search(removeEmpty(filter)).pipe(
      map((response) => {
        this._silentSearch$.next(response?.records?.length || 0);
      })
    );
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
        country: this.userSettingsService.getCountry()
      };
    }
    this._currentSearchFilter$.next(filter);
    return this.adsService.search(removeEmpty(filter)).pipe(tap((result) => this._searchResults$.next(result)));
  }

  setIsCurrentPageSearch(isSearchPage: boolean): void {
    this._isSearchPage$.next(isSearchPage);
  }

  private getInitialFilter(): SearchFilter {
    return {
      country: this.userSettingsService.getCountry()
      // quality: 'GOOD'
    };
  }

  reset(): void {
    this._currentSearchFilter$.next(this.getInitialFilter());
  }
}
