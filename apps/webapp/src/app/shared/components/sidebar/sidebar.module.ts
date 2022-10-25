import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { RouterModule } from '@angular/router';
import { LoginSignupModule } from '../buttons/login-signup/login-signup.module';
import { LogoutButtonModule } from '../buttons/logout/logout-button.module';

@NgModule({
  declarations: [SidebarComponent],
  exports: [SidebarComponent],
  imports: [CommonModule, RouterModule, LoginSignupModule, LogoutButtonModule]
})
export class SidebarModule {}
