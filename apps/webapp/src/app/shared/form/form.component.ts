import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core';

@Component({
  selector: 'bella-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: false,
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
