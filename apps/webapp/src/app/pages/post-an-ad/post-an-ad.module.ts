import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PostAnAdRoutingModule } from './post-an-ad-routing.module';
import { PostAnAdComponent } from './post-an-ad.component';
import { TitledPageModule } from '../../shared/layouts/titled-page/titled-page.module';
import { FormValidationModule } from '../../shared/form/form-validation.module';
import { ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { UploadModule } from '../../shared/components/upload/upload.module';
import { AdFormModule } from './ad-form/ad-form.module';

@NgModule({
  declarations: [PostAnAdComponent],
  imports: [
    CommonModule,
    PostAnAdRoutingModule,
    TitledPageModule,
    NgSelectModule,
    ReactiveFormsModule,
    FormValidationModule,
    UploadModule,
    AdFormModule
  ]
})
export class PostAnAdModule {}
