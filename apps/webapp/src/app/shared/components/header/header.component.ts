import { Component } from '@angular/core';
import { MyDeviceService } from '../../services/my-device.service';
import { DrawerService } from '../drawer/drawer.service';
import { AuthCustomService } from '../../../auth/auth-custom.service';

@Component({
  selector: 'bella-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: false,
})
export class HeaderComponent {
  isAuthenticationLoading$ = this.auth.isLoading$;
  isAuthenticated$ = this.auth.isAuthenticated$;
  isMobileMode = false;

  constructor(
    private drawerService: DrawerService,
    deviceService: MyDeviceService,
    public auth: AuthCustomService
  ) {
    this.isMobileMode = deviceService.isMobile();
  }

  openDrawer(): void {
    this.drawerService.toogle();
  }
}
