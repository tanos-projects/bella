import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './profile.component';
import { ProfileService } from './profile.service';
import { HeaderModule } from '../../../shared/components/header/header.module';
import { FooterModule } from '../../../shared/components/footer/footer.module';

@NgModule({
  declarations: [ProfileComponent],
  imports: [CommonModule, HeaderModule, FooterModule]
})
export class ProfileModule {
  static forRoot(): ModuleWithProviders<ProfileModule> {
    return {
      ngModule: ProfileModule,
      providers: [ProfileService]
    };
  }
}
