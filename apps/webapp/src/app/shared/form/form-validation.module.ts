import { ModuleWithProviders, NgModule } from '@angular/core';
// import { CUSTOM_ERROR_MESSAGES, NgBootstrapFormValidationModule } from 'ng-bootstrap-form-validation';
import { CUSTOM_ERRORS } from './custom-validation-errors';

@NgModule({
  // imports: [NgBootstrapFormValidationModule.forRoot()],
  // exports: [NgBootstrapFormValidationModule]
})
export class FormValidationModule {
  // static forRoot(): ModuleWithProviders<FormValidationModule> {
  //   return {
  //     ngModule: FormValidationModule,
  //     providers: [
  //       {
  //         provide: CUSTOM_ERROR_MESSAGES,
  //         useValue: CUSTOM_ERRORS,
  //         multi: true
  //       }
  //     ]
  //   };
  // }
}
