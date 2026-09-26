import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { MyDeviceService } from '../../../shared/services/my-device.service';
import { ProfileService } from './profile.service';

@Component({
  selector: 'bella-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [CommonModule, HeaderComponent, FooterComponent],
})
export class ProfileComponent {
  private routeParams = inject(ActivatedRoute);
  private profileService = inject(ProfileService);
  private device = inject(MyDeviceService);

  private readonly id: string = this.routeParams.snapshot.params['id'];
  readonly data$ = this.profileService.getProfile(this.id);
  isMobileMode = this.device.isMobile();
}
