import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MyDeviceService } from '../../../shared/services/my-device.service';
import { ProfileService } from './profile.service';

@Component({
  selector: 'bella-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: false,
})
export class ProfileComponent {
  private routeParams = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private device = inject(MyDeviceService);

  private readonly id: string = this.routeParams.snapshot.params['id'];
  readonly data$ = this.profileService.getProfile(this.id);
  isMobileMode = this.device.isMobile();
}
