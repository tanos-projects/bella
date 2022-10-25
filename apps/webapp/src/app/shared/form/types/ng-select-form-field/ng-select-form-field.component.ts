import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';
import { of } from 'rxjs';
import { Observable } from 'rxjs';

@Component({
  selector: 'bella-ng-select-form-field',
  templateUrl: './ng-select-form-field.component.html',
  styleUrls: ['./ng-select-form-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NgSelectFormFieldComponent extends FieldType<FieldTypeConfig> {
  constructor() {
    super();
  }

  get formGroup(): UntypedFormGroup {
    return this.form as UntypedFormGroup;
  }

  get options$(): Observable<any[]> {
    let options = [];
    if (this.field.props.options) {
      if (this.field.props.options instanceof Observable) {
        return this.field.props.options as Observable<any[]>;
      }
      options = this.field.props.options;
    }
    return of(options);
  }
}
