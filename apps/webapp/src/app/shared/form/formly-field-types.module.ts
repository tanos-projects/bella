import { NgModule } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';

import { NgSelectFormFieldComponent } from './types/ng-select-form-field/ng-select-form-field.component';
import {
  isFileImage,
  PictureUploaderFormFieldComponent
} from './types/picture-uploader/picture-uploader';
import { SteppedFormFieldComponent } from './types/stepped-form-field/stepped-form-field';

export function imagesValidator(control: AbstractControl): boolean {
  const images: File[] = control.value;
  return !images || images.every((file) => isFileImage(file));
}

/**
 * Registers ngx-formly's field types (`stepper`, `picture-uploader`,
 * `ng-select`) and default validation messages.
 *
 * `FormlyModule.forChild(...)` returns a `ModuleWithProviders`, which
 * Angular refuses inside a standalone component's own `imports` array
 * (NG2012) — it has to be wrapped in a plain `@NgModule` like this one
 * instead. `FormComponent` (the only consumer, the ngx-formly host) imports
 * this module directly so it carries its own field-type registration with
 * it, the same way `SteppedFormFieldComponent`/`PictureUploaderFormFieldComponent`
 * already carry their own dependencies.
 */
@NgModule({
  imports: [
    FormlyModule.forChild({
      validationMessages: [{ name: 'required', message: 'This field is required' }],
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
  ],
})
export class FormlyFieldTypesModule {}
