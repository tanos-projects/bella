import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdDetailComponent } from './ad-detail.component';
import { RouterModule } from '@angular/router';
import { AdContactsModule } from '../../shared/components/ad-contacts/ad-contacts.module';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderModule } from '../../shared/components/header/header.module';
import { CarouselModule } from '../../shared/components/carousel/carousel.module';

@NgModule({
  declarations: [AdDetailComponent],
  imports: [CommonModule, RouterModule, AdContactsModule, TranslateModule, HeaderModule, CarouselModule]
})
export class AdDetailModule {}
