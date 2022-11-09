import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import {
  AbstractControl,
  ReactiveFormsModule
} from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsModule } from 'ngx-bootstrap/tabs';

import { FormComponent } from './form.component';
import { NgSelectFormFieldComponent } from './types/ng-select-form-field/ng-select-form-field.component';
import { NgSelectFormFieldModule } from './types/ng-select-form-field/ng-select-form-field.module';
import {
  isFileImage,
  PictureUploaderFormFieldComponent,
  PictureUploaderFormFieldModule
} from './types/picture-uploader/picture-uploader';
import { SteppedFormFieldComponent } from './types/stepped-form-field/stepped-form-field';



export function imagesValidator(control: AbstractControl): boolean {
  const images: File[] = control.value;
  return !images || images.every((file) => isFileImage(file));
}


@NgModule({
  declarations: [SteppedFormFieldComponent, FormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TabsModule,
    ProgressbarModule,
    FormlyModule.forChild({
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
      types: [
        { name: 'stepper', component: SteppedFormFieldComponent, wrappers: [] },
        {
          name: 'picture-uploader',
          component: PictureUploaderFormFieldComponent,
          wrappers: [],
          defaultOptions: {
            validators: {
              notAllowedImages: imagesValidator,
            },
          },
        },
        {
          name: 'ng-select',
          component: NgSelectFormFieldComponent,
          wrappers: [],
        },
      ],
    }),

    PictureUploaderFormFieldModule,
    NgSelectFormFieldModule,
  ],
  exports: [FormlyModule, FormComponent],
})
export class FormModule {}
