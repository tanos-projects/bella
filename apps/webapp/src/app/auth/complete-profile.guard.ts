import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { concatMap, finalize, map } from 'rxjs/operators';
import { LoadingService } from '../shared/components/loading/loading.service';
import { AuthUserService } from './auth-user.service';
import { AuthCustomService } from './auth-custom.service';

@Injectable()
export class CompleteProfileGuard implements CanActivate {
  private router = inject(Router);
  private authUser = inject(AuthUserService);
  private auth = inject(AuthCustomService);
  private loadingService = inject(LoadingService);

  canActivate(): Observable<boolean | UrlTree> {
    this.loadingService.show();
    return this.auth.isAuthenticated$.pipe(
      concatMap((authenticated) =>
        authenticated
          ? this.authUser.isProfileCompletionNeeded().pipe(
              map((isProfileCompletionNeeded) => isProfileCompletionNeeded),
              finalize(() => this.loadingService.hide())
            )
          : of(false)
      ),
      map((isProfileCompletionNeeded) => {
        if (isProfileCompletionNeeded) {
          return this.router.createUrlTree(['account/create-profile']);
        }
        return true;
      }),
      finalize(() => this.loadingService.hide())
    );
  }

  canActivateChild(): Observable<boolean | UrlTree> {
    return this.canActivate();
  }
}
