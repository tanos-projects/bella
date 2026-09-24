import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FooterModule } from '../../../shared/components/footer/footer.module';
import { HeaderModule } from '../../../shared/components/header/header.module';
import { MyDeviceService } from '../../../shared/services/my-device.service';
import { ProfileService } from './profile.service';

@Component({
  selector: 'bella-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderModule, FooterModule],
})
export class ProfileComponent {
  private routeParams = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private device = inject(MyDeviceService);

  private readonly id: string = this.routeParams.snapshot.params['id'];
  readonly data$ = this.profileService.getProfile(this.id);
  isMobileMode = this.device.isMobile();
}
