import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

import { AdDTO } from '../../shared/models/ads.model';
import { AdsService } from '../../shared/services/ads.service';
import { MyDeviceService } from '../../shared/services/my-device.service';

@Component({
  selector: 'bella-my-publications',
  templateUrl: './my-publications.component.html',
  styleUrls: ['./my-publications.component.scss'],
})
export class MyPublicationsComponent implements OnInit {
  ads$: Observable<AdDTO[]>;
  isMobileMode = this.device.isMobile();

  constructor(private adsService: AdsService, private device: MyDeviceService) {
    this.ads$ = this.adsService.getMyPublications();
  }

  ngOnInit(): void {}
}
