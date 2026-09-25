import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';

import { FormlyFieldTypesModule } from './formly-field-types.module';

@Component({
  selector: 'bella-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: true,
  // FormlyModule (bare) provides the <formly-form> selector used by this
  // component's own template; FormlyFieldTypesModule provides the field
  // type registration (stepper/picture-uploader/ng-select) that
  // <formly-form> resolves for AdFormComponent's `fields` config.
  imports: [CommonModule, ReactiveFormsModule, FormlyModule, FormlyFieldTypesModule],
})
export class FormComponent {
  @Input() form!: FormGroup;
  @Input() model: any;
  @Input() options!: FormlyFormOptions;
  @Input() fields: FormlyFieldConfig[] = [];

  @Output() submitData = new EventEmitter<any>(true);

  // constructor() {}

  onSubmit(): void {
    this.submitData.emit(this.form.value);
  }
}
