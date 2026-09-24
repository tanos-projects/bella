import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TitledPageComponent } from '../../shared/layouts/titled-page/titled-page.component';
import { AccountRoutingModule } from './account-routing.module';
import { AccountComponent } from './account.component';
import { CreateProfileComponent } from './profile/create/create-profile-component';
import { ProfileFormModule } from './profile/form/profile-form.module';
import { LoginSignupComponent } from '../../shared/components/buttons/login-signup/login-signup.component';
import { LogoutButtonModule } from '../../shared/components/buttons/logout/logout-button.module';

@NgModule({
  declarations: [AccountComponent],
  imports: [
    CommonModule,
    AccountRoutingModule,
    TitledPageComponent,
    ProfileFormModule,
    CreateProfileComponent,
    LoginSignupComponent,
    LogoutButtonModule
  ]
})
export class AccountModule {}
