import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TitledPageModule } from '../../shared/layouts/titled-page/titled-page.module';
import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';
import { CreateProfileModule } from './profile/create/create-profile.module';
import { ProfileFormModule } from './profile/form/profile-form.module';
import { LoginSignupModule } from '../../shared/components/buttons/login-signup/login-signup.module';
import { LogoutButtonModule } from '../../shared/components/buttons/logout/logout-button.module';

@NgModule({
  declarations: [AccountComponent],
  imports: [
    CommonModule,
    AccountRoutingModule,
    TitledPageModule,
    ProfileFormModule,
    CreateProfileModule,
    LoginSignupModule,
    LogoutButtonModule
  ]
})
export class AccountModule {}
