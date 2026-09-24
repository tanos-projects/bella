import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthCustomService } from '../../../auth/auth-custom.service';
import { LoginSignupComponent } from '../buttons/login-signup/login-signup.component';
import { LogoutButtonComponent } from '../buttons/logout/logout-button.component';

@Component({
  selector: 'bella-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, LoginSignupComponent, LogoutButtonComponent],
})
export class SidebarComponent {
  private auth = inject(AuthCustomService);

  isAuthenticationLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;
}
