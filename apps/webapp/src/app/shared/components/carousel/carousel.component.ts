import { Component, Input, OnInit, Output } from '@angular/core';
import { AdImageDTO } from '../../models/ads.model';
import SwiperCore, { Pagination, Navigation } from 'swiper';

SwiperCore.use([Pagination, Navigation]);

@Component({
  selector: 'bella-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  standalone: false,
})
export class CarouselComponent implements OnInit {
  @Input() images: AdImageDTO[] = [];
  constructor() {}

  ngOnInit(): void {}
}
