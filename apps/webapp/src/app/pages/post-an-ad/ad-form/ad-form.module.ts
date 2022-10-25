import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormModule } from '../../../shared/form/form.module';
import { AdFormComponent } from './ad-form.component';

@NgModule({
  declarations: [AdFormComponent],
  exports: [AdFormComponent],
  imports: [CommonModule, FormModule]
})
export class AdFormModule {}
