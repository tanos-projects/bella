import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';

import { SearchFilter } from '../../shared/models/search-filter.model';
import { SearchService } from '../../shared/services/search.service';

@Component({
  selector: 'bella-search-results',
  templateUrl: './search-results.component.html',
  standalone: false,
})
export class SearchResultsComponent /*implements OnInit*/ {
  private route = inject(ActivatedRoute);
  private searchService = inject(SearchService);

  ads$ = this.route.queryParams.pipe(
    switchMap((filter) =>
      this.searchService.searchFromFilter(filter as SearchFilter)
    ),
    map((result) => result.records)
  );

  // ngOnInit(): void {
  //   // sdfdsf
  // }
}
