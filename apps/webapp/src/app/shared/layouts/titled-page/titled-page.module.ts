import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitledPageComponent } from './titled-page.component';
import { FooterModule } from '../../components/footer/footer.module';
import { HeaderComponent } from '../../components/header/header.component';

@NgModule({
  declarations: [TitledPageComponent],
  exports: [TitledPageComponent],
  imports: [CommonModule, HeaderComponent, FooterModule]
})
export class TitledPageModule {}
