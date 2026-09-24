import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private openStateHolder$ = new BehaviorSubject<boolean>(false);
  public opened$ = this.openStateHolder$.asObservable();

  private router = inject(Router);

  constructor() {
    this.openStateHolder$.subscribe({
      next: (value) => {
        if (value) {
          document.body.classList.add('no-scroll');
        } else {
          document.body.classList.remove('no-scroll');
        }
      }
    });

    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe({
      next: () => {
        this.close();
      }
    });
  }

  open(): void {
    this.setState(true);
  }

  close(): void {
    this.setState(false);
  }

  toogle(): void {
    const opened = this.openStateHolder$.getValue();
    this.setState(!opened);
  }

  setState(state: boolean): void {
    this.openStateHolder$.next(state);
  }
}
