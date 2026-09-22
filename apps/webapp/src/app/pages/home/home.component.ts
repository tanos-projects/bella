import { Component, inject } from '@angular/core';
import { finalize, map, mergeMap, reduce } from 'rxjs/operators';

import { LoadingService } from '../../shared/components/loading/loading.service';
import { MyDeviceService } from '../../shared/services/my-device.service';
import { HomeService } from './home.service';

@Component({
  selector: 'bella-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: false,
})
export class HomeComponent {
  private homeService = inject(HomeService);
  private device = inject(MyDeviceService);
  private loadingService = inject(LoadingService);

  isMobileMode = this.device.isMobile();
  adsByCategory$ = this.homeService
    .loadTopAds()
    .pipe(finalize(() => this.loadingService.hide()));
  noAds$ = this.adsByCategory$.pipe(
    mergeMap((adsByCategory) => adsByCategory.map((xx) => xx.ads)),
    reduce((acc, adsByCategory) => [...acc, ...adsByCategory]),
    map((totalAds) => totalAds.length)
  );

  constructor() {
    this.loadingService.show();
  }

  viewAllMostRecentAds(): void {
    //
  }

  viewAllAdsOfCategory(categoryCode: string): void {
    //
  }
}
