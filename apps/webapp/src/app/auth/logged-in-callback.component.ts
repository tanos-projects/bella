import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { concatMap, finalize, map } from 'rxjs/operators';
import { WelcomeService } from '../pages/welcome/welcome.service';
import { LoadingService } from '../shared/components/loading/loading.service';
import { AuthUserService } from './auth-user.service';
import { AuthCustomService } from './auth-custom.service';

@Component({
  selector: 'bella-logged-in-callback',
  templateUrl: 'logged-in-callback.component.html',
  standalone: true,
})
export class LoggedInCallbackComponent implements OnInit {
  private router = inject(Router);
  private authUser = inject(AuthUserService);
  private auth = inject(AuthCustomService);
  private welcomeService = inject(WelcomeService);
  private loadingService = inject(LoadingService);

  ngOnInit(): void {
    this.manageRedirectionToProfileCompletion();
  }

  private manageRedirectionToProfileCompletion(): void {
    this.loadingService.show();
    this.auth.isAuthenticated$
      .pipe(
        concatMap((authenticated) =>
          authenticated
            ? this.authUser.isProfileCompletionNeeded().pipe(
                map((needProfileCompletion) => needProfileCompletion),
                finalize(() => this.loadingService.hide())
              )
            : of(false)
        ),
        finalize(() => this.loadingService.hide())
      )
      .subscribe({
        next: (isProfileCompletionNeeded) => {
          this.welcomeService.validate();
          if (isProfileCompletionNeeded) {
            this.router.navigate(['account/create-profile']);
          } else {
            this.router.navigate(['']);
          }
        },
      });
  }
}
