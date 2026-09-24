import { CommonModule } from '@angular/common';
import { Component, DOCUMENT, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCustomService } from '../../../../auth/auth-custom.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser } from '../../../../auth/auth-user.model';
import { AuthUserService } from '../../../../auth/auth-user.service';
import { LogoutButtonModule } from '../../../../shared/components/buttons/logout/logout-button.module';
import { UserSettingsService } from '../../../../shared/services/user-settings.service';
import { TitledPageComponent } from '../../../../shared/layouts/titled-page/titled-page.component';
import { ProfileFormModule } from '../form/profile-form.module';

@Component({
  selector: 'bella-create-profile',
  templateUrl: './create-profile.component.html',
  standalone: true,
  imports: [CommonModule, TitledPageComponent, ProfileFormModule, LogoutButtonModule],
})
export class CreateProfileComponent {
  private auth = inject(AuthCustomService);
  private userService = inject(AuthUserService);
  private userSettingsService = inject(UserSettingsService);
  private doc = inject<Document>(DOCUMENT);
  private router = inject(Router);

  user$: Observable<AuthUser | null> = this.auth.user$.pipe(
    map((user) => {
      let authUser: AuthUser;
      if (user) {
        authUser = {
          country: this.userSettingsService.getCountry(),
          email: user?.email,
          birthdate: new Date(user?.birthdate),
          lastname: user?.family_name,
          firstname: user?.given_name,
          username: user?.nickname,
          mobilePhone: user?.phone_number,
        };
      }
      return authUser;
    })
  );

  save(user: AuthUser): void {
    this.userService.createProfile(user).subscribe({
      next: () => {
        this.router.navigate(['/account']);
      },
    });
  }
}
