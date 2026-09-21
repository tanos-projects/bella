import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';

import { AdsService } from '../../shared/services/ads.service';
import { ContactService } from '../../shared/services/contact.service';
import { MyDeviceService } from '../../shared/services/my-device.service';

import SwiperCore, { Pagination, Navigation } from 'swiper';

// install Swiper modules
SwiperCore.use([Pagination, Navigation]);

@Component({
  selector: 'bella-ad-detail',
  templateUrl: './ad-detail.component.html',
  styleUrls: ['./ad-detail.component.scss'],
  standalone: false,
})
export class AdDetailComponent {
  isMobileMode: boolean = this.device.isMobile();
  id: string = this.routeParams.snapshot.params['id'];
  ad$ = this.adsService.getPublishedOne(this.id);
  contact$ = this.ad$.pipe(map((ad) => this.contactService.getContactData(ad)));
  currentPageLink!: string;

  constructor(
    private routeParams: ActivatedRoute,
    private device: MyDeviceService,
    private adsService: AdsService,
    private contactService: ContactService,
    private location: Location
  ) {
    this.currentPageLink = window.location.href;
  }

  back(): void {
    this.location.back();
  }
}
