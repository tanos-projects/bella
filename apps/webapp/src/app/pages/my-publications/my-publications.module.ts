import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdCardModule } from '../../shared/components/ad-card/ad-card.module';
import { MyPublicationsComponent } from './my-publications.component';
import { MyPublicationsRoutingModule } from './my-publications-routing.module';
import { HeaderModule } from '../../shared/components/header/header.module';
import { FooterModule } from '../../shared/components/footer/footer.module';

@NgModule({
  declarations: [MyPublicationsComponent],
  imports: [
    CommonModule,
    MyPublicationsRoutingModule,
    AdCardModule,
    HeaderModule,
    FooterModule
  ],
})
export class MyPublicationsModule {}
