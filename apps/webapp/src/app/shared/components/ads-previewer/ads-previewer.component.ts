import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import Swiper from 'swiper';
import { AdDTO } from '../../models/ads.model';
import { MyDeviceService } from '../../services/my-device.service';

@Component({
  selector: 'bella-ads-previewer',
  templateUrl: './ads-previewer.component.html',
  styleUrls: ['./ads-previewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class AdsPreviewerComponent {
  private device = inject(MyDeviceService);

  @Input() adCategory: any;
  @Input() ads: AdDTO[] = [];
  @Input() title!: string;
  @Input() displayedAdsCount = 4;
  @Input() spaceBetween = 30;

  @Output() viewAll = new EventEmitter<void>(true);

  isMobileMode = this.device.isMobile();
  // isSwipeBeginning = true;
  // isSwipeEnd = false;
  swiper!: Swiper;

  trackByAdIdFn(index: number, ad: AdDTO): string {
    return ad.id;
  }

  onSwiper(swiper: Swiper): void {
    // console.log(swiper, 'coucou');
    this.swiper = swiper;
  }

  onSlideChange(swiper: any): void {
    // this.isSwipeBeginning = swiper.isBeginning;
    // this.isSwipeEnd = swiper.isEnd;
    // console.log('isSwipeEnd : ', this.isSwipeEnd);
    // this.swiper = swiper;
  }

  onViewAll(): void {
    this.viewAll.emit();
  }
}
