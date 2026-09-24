import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdCardModule } from '../../shared/components/ad-card/ad-card.module';
import { MyPublicationsComponent } from './my-publications.component';
import { MyPublicationsRoutingModule } from './my-publications-routing.module';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@NgModule({
  declarations: [MyPublicationsComponent],
  imports: [
    CommonModule,
    MyPublicationsRoutingModule,
    AdCardModule,
    HeaderComponent,
    FooterComponent
  ],
})
export class MyPublicationsModule {}
