import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile.component';
import { ProfileService } from './profile.service';

@NgModule({
  declarations: [ProfileComponent],
  imports: [CommonModule]
})
export class ProfileModule {
  static forRoot(): ModuleWithProviders<ProfileModule> {
    return {
      ngModule: ProfileModule,
      providers: [ProfileService]
    };
  }
}
