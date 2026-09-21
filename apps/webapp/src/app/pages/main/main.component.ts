import { Component } from '@angular/core';
import { MyDeviceService } from '../../shared/services/my-device.service';

@Component({
  selector: 'bella-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false,
})
export class MainComponent {
  isMobileMode = this.device.isMobile();
  constructor(private device: MyDeviceService) {}
}
