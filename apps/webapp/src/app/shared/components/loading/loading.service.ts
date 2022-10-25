import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoadingService {
  private _isLoading$ = new BehaviorSubject<boolean>(false);

  isLoading$ = this._isLoading$.asObservable().pipe(
    tap((isLoading) => {
      if (isLoading) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    })
  );

  show(): void {
    this._isLoading$.next(true);
  }

  hide(): void {
    this._isLoading$.next(false);
  }
}
