import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitledPageComponent } from './titled-page.component';
import { FooterComponent } from '../../components/footer/footer.component';
import { HeaderComponent } from '../../components/header/header.component';

@NgModule({
  declarations: [TitledPageComponent],
  exports: [TitledPageComponent],
  imports: [CommonModule, HeaderComponent, FooterComponent]
})
export class TitledPageModule {}
