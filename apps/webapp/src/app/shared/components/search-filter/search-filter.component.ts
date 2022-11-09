import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { removeEmpty, SearchService } from '../../services/search.service';

@Component({
  selector: 'bella-search-filter',
  templateUrl: './search-filter.component.html',
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  approximativeSearchCount$ = this.searchService.silentSearchCount$;
  countries$ = this.searchService.countries$;
  categories$ = this.searchService.categories$;
  qualities$ = this.searchService.qualities$;
  countryCities$ = this.searchService.countryCities$;

  form!: UntypedFormGroup;
  private unsubscribe$ = new Subject<void>();

  constructor(
    private router: Router,
    public modalRef: BsModalRef,
    private fb: UntypedFormBuilder,
    private searchService: SearchService
  ) {
    this.buildForm(fb);
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
