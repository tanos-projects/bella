import { Component, inject } from '@angular/core';
import { MyDeviceService } from '../../shared/services/my-device.service';

@Component({
  selector: 'bella-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: false,
})
export class MainComponent {
  private device = inject(MyDeviceService);

  isMobileMode = this.device.isMobile();
}
