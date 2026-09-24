import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdDetailComponent } from './ad-detail.component';
import { RouterModule } from '@angular/router';
import { AdContactsComponent } from '../../shared/components/ad-contacts/ad-contacts.component';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderModule } from '../../shared/components/header/header.module';
import { CarouselModule } from '../../shared/components/carousel/carousel.module';
import { AdPublisherCardModule } from '../../shared/components/ad-publisher-card/ad-publisher-card.module';

@NgModule({
  declarations: [AdDetailComponent],
  imports: [CommonModule, RouterModule, AdContactsComponent, TranslatePipe, HeaderModule, CarouselModule, AdPublisherCardModule]
})
export class AdDetailModule {}
