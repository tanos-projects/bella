import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgSelectModule } from '@ng-select/ng-select';
import { FieldErrorModule } from '../../../../shared/form/field-error/field-error.module';
import { ProfileFormComponent } from './profile-form.component';

@NgModule({
  declarations: [ProfileFormComponent],
  exports: [ProfileFormComponent],
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, RouterModule, FieldErrorModule]
})
export class ProfileFormModule {}
