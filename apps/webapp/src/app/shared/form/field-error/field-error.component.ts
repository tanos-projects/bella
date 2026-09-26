import { Component, Input } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { VALIDATION_MESSAGE_FORMATTERS } from '../validation-messages';

@Component({
  selector: 'bella-field-error',
  templateUrl: './field-error.component.html',
  standalone: true,
})
export class FieldErrorComponent {
  @Input() control: AbstractControl | null = null;
  @Input() label?: string;

  get message(): string {
    if (
      !this.control ||
      this.control.valid ||
      (!this.control.touched && !this.control.dirty)
    ) {
      return '';
    }
    const errors = this.control.errors ?? {};
    const key = Object.keys(errors)[0];
    return VALIDATION_MESSAGE_FORMATTERS[key]?.(errors[key], this.label) ?? '';
  }
}
