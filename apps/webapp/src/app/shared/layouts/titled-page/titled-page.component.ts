import { Component, Input } from '@angular/core';
import { MyDeviceService } from '../../services/my-device.service';

@Component({
  selector: 'bella-titled-page',
  templateUrl: './titled-page.component.html',
  styleUrls: ['./titled-page.component.scss']
})
export class TitledPageComponent {
  @Input() title!: string;

  isMobileMode = this.device.isMobile();
  constructor(private device: MyDeviceService) {}
}
