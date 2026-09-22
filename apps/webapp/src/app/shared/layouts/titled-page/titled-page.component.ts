import { Component, Input, inject } from '@angular/core';
import { MyDeviceService } from '../../services/my-device.service';

@Component({
  selector: 'bella-titled-page',
  templateUrl: './titled-page.component.html',
  styleUrls: ['./titled-page.component.scss'],
  standalone: false,
})
export class TitledPageComponent {
  private device = inject(MyDeviceService);

  @Input() title!: string;

  isMobileMode = this.device.isMobile();
}
