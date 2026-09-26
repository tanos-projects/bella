import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, Component, Input, OnInit, Output } from '@angular/core';
import { AdImageDTO } from '../../models/ads.model';

@Component({
  selector: 'bella-carousel',
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss'],
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CarouselComponent implements OnInit {
  @Input() images: AdImageDTO[] = [];
  constructor() {}

  ngOnInit(): void {}
}
