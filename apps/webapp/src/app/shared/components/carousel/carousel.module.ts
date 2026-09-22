import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CarouselComponent } from './carousel.component'


@NgModule({
  declarations: [
    CarouselComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CarouselComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CarouselModule { }
