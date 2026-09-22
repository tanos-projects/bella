import { Component, OnInit, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AdDTO } from '../../shared/models/ads.model';
import { AdsService } from '../../shared/services/ads.service';
import { MyDeviceService } from '../../shared/services/my-device.service';

@Component({
  selector: 'bella-my-publications',
  templateUrl: './my-publications.component.html',
  styleUrls: ['./my-publications.component.scss'],
  standalone: false,
})
export class MyPublicationsComponent implements OnInit {
  private adsService = inject(AdsService);
  private device = inject(MyDeviceService);

  publications$: Observable<AdDTO[]>;
  submittedPublications$: Observable<AdDTO[]>;
  drafts$: Observable<AdDTO[]>;
  isMobileMode = this.device.isMobile();

  constructor() {
    this.publications$ = this.adsService.getMyPublishedPublications();
    this.submittedPublications$ = this.adsService.getMySubmittedPublications();
    this.drafts$ = this.adsService.getMyDraftPublications();
  }

  ngOnInit(): void {}
}
