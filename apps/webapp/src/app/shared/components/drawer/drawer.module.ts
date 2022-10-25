import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from './drawer.component';
import { DrawerService } from './drawer.service';

@NgModule({
  declarations: [DrawerComponent],
  exports: [DrawerComponent],
  imports: [CommonModule]
})
export class DrawerModule {
  static forRoot(): ModuleWithProviders<DrawerModule> {
    return {
      ngModule: DrawerModule,
      providers: [DrawerService]
    };
  }
}
