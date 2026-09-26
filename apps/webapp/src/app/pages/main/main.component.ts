import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MyDeviceService } from '../../shared/services/my-device.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'bella-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [RouterModule, HeaderComponent, FooterComponent],
})
export class MainComponent {
  private device = inject(MyDeviceService);

  isMobileMode = this.device.isMobile();
}
