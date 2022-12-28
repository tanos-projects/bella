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
  publications$: Observable<AdDTO[]>;
  submittedPublications$: Observable<AdDTO[]>;
  drafts$: Observable<AdDTO[]>;
  isMobileMode = this.device.isMobile();

  constructor(private adsService: AdsService, private device: MyDeviceService) {
    this.publications$ = this.adsService.getMyPublishedPublications();
    this.submittedPublications$ = this.adsService.getMySubmittedPublications();
    this.drafts$ = this.adsService.getMyDraftPublications();
  }

  ngOnInit(): void {}
}
