import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TitledPageModule } from '../../../../shared/layouts/titled-page/titled-page.module';
import { ProfileFormModule } from '../form/profile-form.module';
import { CreateProfileComponent } from './create-profile-component';
import { LogoutButtonModule } from '../../../../shared/components/buttons/logout/logout-button.module';

@NgModule({
  imports: [CommonModule, TitledPageModule, ProfileFormModule, LogoutButtonModule],
  exports: [CreateProfileComponent],
  declarations: [CreateProfileComponent]
})
export class CreateProfileModule {}
