import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { MyDeviceService } from '../../shared/services/my-device.service';
import { environment } from '../../../environments/environment';
import { WelcomeService } from '../welcome/welcome.service';

@Component({
  selector: 'bella-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  providers: [WelcomeService]
})
export class SettingsComponent {
  deviceInfo = this.deviceService.getInfo();
  health$!: Observable<unknown>;
  constructor(
    private deviceService: MyDeviceService,
    private welcomeService: WelcomeService,
    private http: HttpClient
  ) {
    this.health$ = this.http.get(`${environment.apiBaseUrl}/health`);
  }

  clearSettings(): void {
    this.welcomeService.reset();
  }
}
