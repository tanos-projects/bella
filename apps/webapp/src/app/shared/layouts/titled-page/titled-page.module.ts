import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TitledPageComponent } from './titled-page.component';
import { FooterModule } from '../../components/footer/footer.module';
import { HeaderModule } from '../../components/header/header.module';

@NgModule({
  declarations: [TitledPageComponent],
  exports: [TitledPageComponent],
  imports: [CommonModule, HeaderModule, FooterModule]
})
export class TitledPageModule {}
