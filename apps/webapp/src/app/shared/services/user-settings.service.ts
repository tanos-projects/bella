import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { skip } from 'rxjs/operators';

import { AuthUser } from '../../auth/auth-user.model';

const COUNTRY_ENTRY_KEY = 'user-country';

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private readonly _country$ = new BehaviorSubject<string>('');
  readonly country$ = this._country$.asObservable() as Observable<string>;
  private readonly _profile$ = new BehaviorSubject<AuthUser | null>(null);
  readonly profile$ = this._profile$.asObservable() as Observable<AuthUser>;

  constructor() {
    this._country$.pipe(skip(1)).subscribe((value) => {
      if (value) {
        window.localStorage.setItem(COUNTRY_ENTRY_KEY, value);
      } else {
        window.localStorage.removeItem(COUNTRY_ENTRY_KEY);
      }
    });

    this.setCountry(window.localStorage.getItem(COUNTRY_ENTRY_KEY));
  }

  setCountry(country: string | null): void {
    this._country$.next(country || '');
  }

  getCountry(): string {
    return this._country$.value;
  }

  setProfile(profile: AuthUser): void {
    this._profile$.next(profile);
  }

  getProfile(): AuthUser | null {
    return this._profile$.value;
  }

  hasCountrySet(): boolean {
    return Boolean(this._country$.value);
  }

  reset(): void {
    window.localStorage.removeItem(COUNTRY_ENTRY_KEY);
  }
}
