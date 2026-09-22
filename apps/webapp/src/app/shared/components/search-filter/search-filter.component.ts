import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NO_QUALITY_CATEGORIES } from '../../services/categories.service';

import { removeEmpty, SearchService } from '../../services/search.service';

@Component({
  selector: 'bella-search-filter',
  templateUrl: './search-filter.component.html',
  standalone: false,
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  public modalRef = inject(BsModalRef);
  private fb = inject(UntypedFormBuilder);
  private searchService = inject(SearchService);

  approximativeSearchCount$ = this.searchService.silentSearchCount$;
  countries$ = this.searchService.countries$;
  categories$ = this.searchService.categories$;
  qualities$ = this.searchService.qualities$;
  countryCities$ = this.searchService.countryCities$;

  NO_QUALITY_ALLOWED_CATEGORIES: Readonly<string[]> = NO_QUALITY_CATEGORIES;

  form!: UntypedFormGroup;
  private unsubscribe$ = new Subject<void>();

  constructor() {
    this.buildForm(this.fb);
  }

  private buildForm(fb: UntypedFormBuilder): void {
    this.form = fb.group({
      category: [null],
      city: [null],
      country: [null],
      maxPrice: [null],
      minPrice: [null],
      keyword: [null],
      quality: [null],
    });
  }

  ngOnInit(): void {
    this.searchService.enableSilentSearch();

    // Component -> State
    // reset city on country value change
    this.form
      .get('country')
      .valueChanges.pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: () => {
          const cityFormControl = this.form.get('city');
          if (cityFormControl.value) {
            cityFormControl.reset();
          }
        },
      });

    this.form
      .get('category')
      .valueChanges.pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (value) => {
          if (this.NO_QUALITY_ALLOWED_CATEGORIES.includes(value)) {
            this.form.get('quality').reset();
          }
        },
      });

    this.form.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe({
      next: (filterValues) => {
        console.log('Component -> State : ', filterValues);
        this.searchService.updateFilterForSilentSearch(filterValues);
      },
    });

    // State -> Component
    this.searchService.currentSearchFilter$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe({
        next: (filterValues) => {
          console.log('State -> Component : ', filterValues);
          this.form.patchValue({ ...filterValues }, { emitEvent: false });
        },
      });
  }

  sendSearchFilter(): void {
    this.modalRef.hide();
    const filter = removeEmpty(this.form.value);
    this.router.navigate(['annonces/recherche'], {
      queryParams: { ...filter },
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
