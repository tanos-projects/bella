import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MyDeviceService } from '../../services/my-device.service';
import { DrawerService } from '../drawer/drawer.service';
import { AuthCustomService } from '../../../auth/auth-custom.service';
import { LoginSignupModule } from '../buttons/login-signup/login-signup.module';
import { LogoutButtonModule } from '../buttons/logout/logout-button.module';
import { SearchFilterButtonComponent } from '../search-filter-button/search-filter-button.component';

@Component({
  selector: 'bella-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    SearchFilterButtonComponent,
    LoginSignupModule,
    LogoutButtonModule,
  ],
})
export class HeaderComponent {
  private drawerService = inject(DrawerService);
  private deviceService = inject(MyDeviceService);
  public auth = inject(AuthCustomService);

  isAuthenticationLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;
  isMobileMode = false;

  constructor() {
    this.isMobileMode = this.deviceService.isMobile();
  }

  openDrawer(): void {
    this.drawerService.toogle();
  }
}
