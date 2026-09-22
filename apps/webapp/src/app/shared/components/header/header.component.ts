import { Component, inject } from '@angular/core';
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
