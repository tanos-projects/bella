import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterToolbarActionComponent } from './footer-toolbar-action.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [FooterToolbarActionComponent],
  exports: [FooterToolbarActionComponent],
  imports: [CommonModule, RouterModule]
})
export class FooterToolbarActionModule {}
