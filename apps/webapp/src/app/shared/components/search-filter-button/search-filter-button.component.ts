import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BsModalService } from 'ngx-bootstrap/modal';
import { map } from 'rxjs/operators';

import { SearchService } from '../../services/search.service';
import { UserSettingsService } from '../../services/user-settings.service';
import { SearchFilterComponent } from '../search-filter/search-filter.component';

@Component({
  selector: 'bella-search-filter-button',
  templateUrl: './search-filter-button.component.html',
  styleUrls: ['./search-filter-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SearchFilterButtonComponent /*implements OnInit*/ {
  countries$ = this.searchService.countries$;
  // FIXME : Doesn't work when search has no result or ...
  searchText$ = this.searchService.currentSearchFilter$.pipe(
    map((filter) => filter?.keyword)
  );
  country$ = this.userSettingsService.country$;
  isSearchPage$ = this.searchService.isSearchPage$;

  constructor(
    private searchService: SearchService,
    private modalService: BsModalService,
    private userSettingsService: UserSettingsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  openFilter(): void {
    this.modalService.show(SearchFilterComponent, {
      class: 'modal-dialog modal-lg mx-auto',
    });
  }

  onCountryChange(countryIso2: string): void {
    this.userSettingsService.setCountry(countryIso2);
    this.router.routeReuseStrategy.shouldReuseRoute = function () {
      return false;
    };
    this.router.navigate(['/']);
  }
}
