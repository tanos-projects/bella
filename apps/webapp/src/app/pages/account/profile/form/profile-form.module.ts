import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormValidationModule } from '../../../../shared/form/form-validation.module';
import { ProfileFormComponent } from './profile-form.component';

@NgModule({
  declarations: [ProfileFormComponent],
  exports: [ProfileFormComponent],
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, FormValidationModule]
})
export class ProfileFormModule {}
