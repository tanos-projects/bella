import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { finalize, map, mergeMap, reduce, shareReplay } from 'rxjs/operators';

import { LoadingService } from '../../shared/components/loading/loading.service';
import { MyDeviceService } from '../../shared/services/my-device.service';
import { AdsPreviewerComponent } from '../../shared/components/ads-previewer/ads-previewer.component';
import { HomeService } from './home.service';

@Component({
  selector: 'bella-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, AdsPreviewerComponent],
  providers: [HomeService],
})
export class HomeComponent {
  private homeService = inject(HomeService);
  private device = inject(MyDeviceService);
  private loadingService = inject(LoadingService);
  private router = inject(Router);

  isMobileMode = this.device.isMobile();
  adsByCategory$ = this.homeService
    .loadTopAds()
    .pipe(
      finalize(() => this.loadingService.hide()),
      shareReplay(1)
    );
  noAds$ = this.adsByCategory$.pipe(
    mergeMap((adsByCategory) => adsByCategory.map((xx) => xx.ads)),
    reduce((acc, adsByCategory) => [...acc, ...adsByCategory]),
    map((totalAds) => totalAds.length === 0)
  );

  constructor() {
    this.loadingService.show();
  }

  viewAllMostRecentAds(): void {
    //
  }

  viewAllAdsOfCategory(categoryCode: string): void {
    this.router.navigate(['/', categoryCode]);
  }
}
