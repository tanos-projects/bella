import { Component, OnDestroy, inject } from '@angular/core';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { DeviceInfo } from 'ngx-device-detector';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { AuthUser } from './auth/auth-user.model';
import { MyDeviceService } from './shared/services/my-device.service';
import { SearchService } from './shared/services/search.service';

@Component({
  selector: 'bella-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnDestroy {
  private router = inject(Router);
  private searchService = inject(SearchService);
  private deviceService = inject(MyDeviceService);
  private translate = inject(TranslateService);

  isMobileMode = false;
  info!: Readonly<DeviceInfo>;
  profile!: AuthUser;

  private unsubscribe$ = new Subject<void>();

  constructor() {
    this.isMobileMode = this.deviceService.isMobile();
    this.info = this.deviceService.getInfo();

    this.translate.addLangs(['fr']);
    this.translate.use('fr');

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationStart => event instanceof NavigationStart
        ),
        takeUntil(this.unsubscribe$)
      )
      .subscribe((event: RouterEvent) => {
        this.searchService.setIsCurrentPageSearch(
          event.url.includes('/recherche')
        );
      });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
