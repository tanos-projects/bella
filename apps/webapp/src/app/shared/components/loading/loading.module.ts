import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from './loading.component';
import { LoadingService } from './loading.service';
import { SpinnerComponent } from '../spinner/spinner.component';

@NgModule({
  declarations: [LoadingComponent],
  exports: [LoadingComponent],
  imports: [CommonModule, SpinnerComponent]
})
export class LoadingModule {
  static forRoot(): ModuleWithProviders<LoadingModule> {
    return {
      ngModule: LoadingModule,
      providers: [LoadingService]
    };
  }
}
