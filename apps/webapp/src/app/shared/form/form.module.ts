import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormlyModule } from '@ngx-formly/core';
import { SteppedFormFieldComponent } from './types/stepped-form-field/stepped-form-field';
import { FormComponent } from './form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import {
  PictureUploaderFormFieldComponent,
  PictureUploaderFormFieldModule
} from './types/picture-uploader/picture-uploader';
import { NgSelectFormFieldModule } from './types/ng-select-form-field/ng-select-form-field.module';
import { NgSelectFormFieldComponent } from './types/ng-select-form-field/ng-select-form-field.component';

@NgModule({
  declarations: [SteppedFormFieldComponent, FormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    ProgressbarModule,
    FormlyModule.forChild({
      // validationMessages: [{ name: 'required', message: 'This field is required' }],
      types: [
        { name: 'stepper', component: SteppedFormFieldComponent, wrappers: [] },
        { name: 'picture-uploader', component: PictureUploaderFormFieldComponent, wrappers: [] },
        { name: 'ng-select', component: NgSelectFormFieldComponent, wrappers: [] }
      ]
    }),

    PictureUploaderFormFieldModule,
    NgSelectFormFieldModule
  ],
  exports: [FormlyModule, FormComponent]
})
export class FormModule {}
