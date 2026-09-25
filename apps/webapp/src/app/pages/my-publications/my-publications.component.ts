import { Component, OnInit, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { startWith, switchMap } from 'rxjs/operators';

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

  // Renewing an ad moves it out of "expired" and into "published" - both
  // lists are re-fetched from this so a renewal is reflected in both.
  private refresh$ = new Subject<void>();

  publications$: Observable<AdDTO[]>;
  submittedPublications$: Observable<AdDTO[]>;
  drafts$: Observable<AdDTO[]>;
  expiredPublications$: Observable<AdDTO[]>;
  isMobileMode = this.device.isMobile();
  renewingId: string | null = null;

  constructor() {
    this.publications$ = this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.adsService.getMyPublishedPublications())
    );
    this.submittedPublications$ = this.adsService.getMySubmittedPublications();
    this.drafts$ = this.adsService.getMyDraftPublications();
    this.expiredPublications$ = this.refresh$.pipe(
      startWith(undefined),
      switchMap(() => this.adsService.getMyExpiredPublications())
    );
  }

  ngOnInit(): void {}

  renew(id: string): void {
    this.renewingId = id;
    this.adsService.renew(id).subscribe({
      next: () => {
        this.renewingId = null;
        this.refresh$.next();
      },
      error: () => {
        this.renewingId = null;
      },
    });
  }
}
