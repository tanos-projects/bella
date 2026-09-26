import { Component, ViewChild } from '@angular/core';
import { FieldType, FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { TabsetComponent } from 'ngx-bootstrap/tabs';
import { environment } from '../../../../../environments/environment';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'stepped-form-field',
  styles: [
    `
      .progression-bar {
        height: 20px;
      }
    `,
  ],
  template: `
    @if (field.fieldGroup?.length; as nbFields) {
      <div class="progression-bar">
        <progressbar
          [value]="((currentStep + 1) / nbFields) * 100"
          [striped]="false"
          [type]="'info'"
        ></progressbar>
      </div>
      @if (debug) {
        @for (step of field.fieldGroup; track step; let index = $index; let last = $last) {
          <button type="button" (click)="selectTab(index)">{{ index }}</button>
        }
      }
      @for (step of field.fieldGroup; track step; let index = $index; let last = $last) {
        @if (currentStep === index) {
          <div>
            <div>
              @if (index !== 0) {
                <button
                  (click)="selectTab(index - 1)"
                  class="btn btn-primary"
                  type="button"
                >
                  <
                </button>
              }
            </div>
            <div class="my-2">
              <formly-field [field]="step"></formly-field>
            </div>

            <div>
              @if (!last) {
                <button
                  (click)="selectTab(index + 1)"
                  class="btn btn-primary w-100"
                  type="button"
                  [disabled]="!isValid(step)"
                >
                  Continuer
                </button>
              }
            </div>
            <div>
              @if (field.props['submitButton'] && last) {
                <button
                  class="btn btn-primary w-100"
                  [disabled]="!form.valid || options.formState['submitting']"
                  type="submit"
                >
                  {{ field.props['submitButtonLabel'] ?? 'Submit' }}
                </button>
              }
            </div>
          </div>
        }
      }
    }
  `,
  standalone: true,
  imports: [ProgressbarModule, FormlyModule],
})
export class SteppedFormFieldComponent extends FieldType {
  @ViewChild('staticTabs', { static: false }) staticTabs?: TabsetComponent;
  uid: string;
  debug = !environment.production;

  currentStep = 0;

  constructor() {
    super();
    this.uid = `${Date.now()}`;
  }

  selectTab(tabId: number) {
    // if (this.staticTabs?.tabs[tabId]) {
    //   this.staticTabs.tabs[tabId].active = true;
    // }
    this.currentStep = tabId;
  }

  isValid(field: FormlyFieldConfig): boolean {
    if (field.key) {
      return Boolean(field.formControl?.valid);
    }
    // console.log(field.fieldGroup)
    return field.fieldGroup
      ? field.fieldGroup.every((f) => this.isValid(f))
      : true;
  }
}
