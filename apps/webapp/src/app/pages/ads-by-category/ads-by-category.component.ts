import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { AdDTO } from '../../shared/models/ads.model';
import { AdsService } from '../../shared/services/ads.service';

@Component({
  selector: 'bella-ads-by-category',
  templateUrl: './ads-by-category.component.html',
  styleUrls: ['./ads-by-category.component.scss'],
  standalone: false,
})
export class AdsByCategoryComponent {
  ads$: Observable<AdDTO[]>;
  categoryCode!: string;

  constructor(private route: ActivatedRoute, private adsService: AdsService) {
    this.categoryCode = this.route.snapshot.paramMap.get('category');
    this.ads$ = this.adsService.getAll(this.categoryCode);
  }
}
