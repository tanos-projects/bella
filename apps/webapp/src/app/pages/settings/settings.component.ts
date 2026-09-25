import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { MyDeviceService } from '../../shared/services/my-device.service';
import { environment } from '../../../environments/environment';
import { WelcomeService } from '../welcome/welcome.service';
import { TitledPageComponent } from '../../shared/layouts/titled-page/titled-page.component';

@Component({
  selector: 'bella-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  standalone: true,
  imports: [CommonModule, TitledPageComponent],
  providers: [WelcomeService],
})
export class SettingsComponent {
  private deviceService = inject(MyDeviceService);
  private welcomeService = inject(WelcomeService);
  private http = inject(HttpClient);

  deviceInfo = this.deviceService.getInfo();
  health$!: Observable<unknown>;

  constructor() {
    this.health$ = this.http.get(`${environment.apiBaseUrl}/health`);
  }

  clearSettings(): void {
    this.welcomeService.reset();
  }
}
