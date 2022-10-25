import { Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { concatMap, map, reduce, tap } from 'rxjs/operators';
import { AdDTO } from '../../shared/models/ads.model';
import { CategoryDTO } from '../../shared/models/categories.model';
import { AdsService } from '../../shared/services/ads.service';
import { CategoriesService } from '../../shared/services/categories.service';

export interface AdsByCategory {
  category: CategoryDTO;
  ads: AdDTO[];
}

@Injectable()
export class HomeService {
  constructor(private adsService: AdsService, private categoriesService: CategoriesService) {}

  loadTopAds(): Observable<AdsByCategory[]> {
    return this.categoriesService.getTop().pipe(
      concatMap((topCategories) => {
        return forkJoin(
          topCategories.map((category) =>
            this.adsService.getMostRecentAdsByCategory(category).pipe(
              map((ads) => {
                const adsByCategory: AdsByCategory = {
                  category,
                  ads
                };
                return adsByCategory;
              })
            )
          )
        );
      })
    );
  }

  // getMostRecentAds(): Observable<AdDTO[]> {
  //   return this.adsService.getMostRecentAds();
  // }
}
