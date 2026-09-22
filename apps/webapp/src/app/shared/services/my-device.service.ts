import { Injectable, inject } from '@angular/core';
import { DeviceDetectorService, DeviceInfo } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class MyDeviceService {
  private deviceService = inject(DeviceDetectorService);

  getInfo(): Readonly<DeviceInfo> {
    return this.deviceService.getDeviceInfo();
  }

  isMobile(): boolean {
    return this.deviceService.isMobile();
  }

  isTablet(): boolean {
    return this.deviceService.isTablet();
  }

  isDesktop(): boolean {
    return this.deviceService.isDesktop();
  }
}
