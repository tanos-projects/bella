import { Component, inject } from '@angular/core';

import { AuthCustomService } from '../../../../auth/auth-custom.service';

@Component({
  selector: 'bella-logout-btn',
  templateUrl: './logout-button.component.html',
  standalone: true,
})
export class LogoutButtonComponent {
  private auth = inject(AuthCustomService);

  logout(): void {
    this.auth.logout();
  }
}
