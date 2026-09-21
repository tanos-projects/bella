import { Component } from '@angular/core';
import { AuthCustomService } from '../../../auth/auth-custom.service';

@Component({
  selector: 'bella-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: false,
})
export class SidebarComponent {
  isAuthenticationLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;

  constructor(private auth: AuthCustomService) {}
}
