import { Injectable } from '@angular/core';
import { DeviceDetectorService, DeviceInfo } from 'ngx-device-detector';

@Injectable({
  providedIn: 'root'
})
export class MyDeviceService {
  constructor(private deviceService: DeviceDetectorService) {}

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
