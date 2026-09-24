import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdDetailComponent } from './ad-detail.component';
import { RouterModule } from '@angular/router';
import { AdContactsComponent } from '../../shared/components/ad-contacts/ad-contacts.component';
import { TranslatePipe } from '@ngx-translate/core';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { CarouselComponent } from '../../shared/components/carousel/carousel.component';
import { AdPublisherCardComponent } from '../../shared/components/ad-publisher-card/ad-publisher-card.component';

@NgModule({
  declarations: [AdDetailComponent],
  imports: [CommonModule, RouterModule, AdContactsComponent, TranslatePipe, HeaderComponent, CarouselComponent, AdPublisherCardComponent]
})
export class AdDetailModule {}
