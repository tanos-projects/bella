import { Component, inject } from '@angular/core';
import { AuthCustomService } from '../../../auth/auth-custom.service';

@Component({
  selector: 'bella-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false,
})
export class SidebarComponent {
  private auth = inject(AuthCustomService);

  isAuthenticationLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;
}
