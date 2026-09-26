import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { MyDeviceService } from '../../services/my-device.service';
import { HeaderComponent } from '../../components/header/header.component';
import { FooterComponent } from '../../components/footer/footer.component';

@Component({
  selector: 'bella-titled-page',
  templateUrl: './titled-page.component.html',
  styleUrls: ['./titled-page.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
})
export class TitledPageComponent {
  private device = inject(MyDeviceService);

  @Input() title!: string;

  isMobileMode = this.device.isMobile();
}
