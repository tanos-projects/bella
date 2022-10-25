import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterComponent } from './footer.component';
import { FooterToolbarActionModule } from '../buttons/footer-toolbar-action/footer-toolbar-action.module';

@NgModule({
  declarations: [FooterComponent],
  exports: [FooterComponent],
  imports: [CommonModule, FooterToolbarActionModule]
})
export class FooterModule {}
