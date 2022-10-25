import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';

import { SearchFilter } from '../../shared/models/search-filter.model';
import { SearchService } from '../../shared/services/search.service';

@Component({
  selector: 'bella-search-results',
  templateUrl: './search-results.component.html'
})
export class SearchResultsComponent /*implements OnInit*/ {
  ads$ = this.route.queryParams.pipe(
    switchMap((filter) => this.searchService.searchFromFilter(filter as SearchFilter)),
    map((result) => result.records)
  );

  constructor(private route: ActivatedRoute, private searchService: SearchService) {
    // this.ads$ = this.adsService.getAll(this.categoryCode);
  }

  // ngOnInit(): void {
  //   // sdfdsf
  // }
}
