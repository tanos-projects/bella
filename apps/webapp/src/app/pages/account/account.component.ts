import { Component, DOCUMENT, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { AuthUser } from '../../auth/auth-user.model';
import { AuthUserService } from '../../auth/auth-user.service';
import { LoadingService } from '../../shared/components/loading/loading.service';
import { UserSettingsService } from '../../shared/services/user-settings.service';
import { AuthCustomService } from '../../auth/auth-custom.service';

@Component({
  selector: 'bella-account',
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.scss'],
  standalone: false,
})
export class AccountComponent {
  public auth = inject(AuthCustomService);
  private doc = inject<Document>(DOCUMENT);
  private userService = inject(AuthUserService);
  private loadingService = inject(LoadingService);
  private userSettingsService = inject(UserSettingsService);

  isAuthenticated$ = this.auth.isAuthenticated$;
  user$ = this.auth.user$;
  currentUser$ = this.userService.getProfile();

  updateProfile(update: AuthUser): void {
    this.loadingService.show();
    this.userService
      .updateProfile(update)
      .pipe(
        finalize(() => {
          this.loadingService.hide();
          this.userSettingsService.setCountry(update.country as string);
        })
      )
      .subscribe();
  }

  deleteProfile(): void {
    if (
      window.confirm(
        'Votre compte sera supprimé et vos données seront perdues !'
      )
    ) {
      this.loadingService.show();
      this.userService
        .deleteProfile()
        .pipe(finalize(() => this.loadingService.hide()))
        .subscribe({
          next: () => {
            this.auth.logout();
          },
        });
    }
  }
}
