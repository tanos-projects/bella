import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { AdsService } from '../../shared/services/ads.service';
import { ContactService } from '../../shared/services/contact.service';
import { MyDeviceService } from '../../shared/services/my-device.service';

@Component({
  selector: 'bella-ad-detail',
  templateUrl: './ad-detail.component.html',
  styleUrls: ['./ad-detail.component.scss'],
  standalone: false,
})
export class AdDetailComponent {
  private routeParams = inject(ActivatedRoute);
  private device = inject(MyDeviceService);
  private adsService = inject(AdsService);
  private contactService = inject(ContactService);
  private location = inject(Location);

  isMobileMode: boolean = this.device.isMobile();
  id: string = this.routeParams.snapshot.params['id'];
  ad$ = this.adsService.getPublishedOne(this.id);
  contact$ = this.ad$.pipe(map((ad) => this.contactService.getContactData(ad)));
  currentPageLink!: string;

  constructor() {
    this.currentPageLink = window.location.href;
  }

  back(): void {
    this.location.back();
  }
}
