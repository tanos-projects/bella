import { DOCUMENT } from '@angular/common';
import { Inject } from '@angular/core';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthCustomService } from '../../../../auth/auth-custom.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthUser } from '../../../../auth/auth-user.model';
import { AuthUserService } from '../../../../auth/auth-user.service';
import { UserSettingsService } from '../../../../shared/services/user-settings.service';

@Component({
  selector: 'bella-create-profile',
  templateUrl: './create-profile.component.html',
  standalone: false,
})
export class CreateProfileComponent {
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
  constructor(
    private auth: AuthCustomService,
    private userService: AuthUserService,
    private userSettingsService: UserSettingsService,
    @Inject(DOCUMENT) private doc: Document,
    private router: Router
  ) {}

  save(user: AuthUser): void {
    this.userService.createProfile(user).subscribe({
      next: () => {
        this.router.navigate(['/account']);
      },
    });
  }
}
