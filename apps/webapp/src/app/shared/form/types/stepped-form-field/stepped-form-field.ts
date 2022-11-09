import { Component, ViewChild } from '@angular/core';
import { FieldType, FormlyFieldConfig } from '@ngx-formly/core';
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
    <ng-container *ngIf="field.fieldGroup?.length; let nbFields">
      <div class="progression-bar">
        <progressbar
          [value]="((currentStep + 1) / nbFields) * 100"
          [striped]="false"
          [type]="'info'"
        ></progressbar>
      </div>
      <ng-container *ngIf="debug">
        <ng-container
          *ngFor="
            let step of field.fieldGroup;
            let index = index;
            let last = last
          "
        >
          <button type="button" (click)="selectTab(index)">{{ index }}</button>
        </ng-container>
      </ng-container>
      <ng-container
        *ngFor="
          let step of field.fieldGroup;
          let index = index;
          let last = last
        "
      >
        <div *ngIf="currentStep === index">
          <div>
            <button
              *ngIf="index !== 0"
              (click)="selectTab(index - 1)"
              class="btn btn-primary"
              type="button"
            >
              <
            </button>
          </div>
          <div class="my-2">
            <formly-field [field]="step"></formly-field>
          </div>

          <div>
            <button
              *ngIf="!last"
              (click)="selectTab(index + 1)"
              class="btn btn-primary w-100"
              type="button"
              [disabled]="!isValid(step)"
            >
              Continuer
            </button>
          </div>
          <div>
            <button
              *ngIf="field.props['submitButton'] && last"
              class="btn btn-primary w-100"
              [disabled]="!form.valid || options.formState['submitting']"
              type="submit"
            >
              {{ field.props['submitButtonLabel'] ?? 'Submit' }}
            </button>
          </div>
        </div>
      </ng-container>
    </ng-container>
  `,
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
