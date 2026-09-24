import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { RouterModule } from '@angular/router';
import { LoginSignupComponent } from '../buttons/login-signup/login-signup.component';
import { LogoutButtonComponent } from '../buttons/logout/logout-button.component';

@NgModule({
  declarations: [SidebarComponent],
  exports: [SidebarComponent],
  imports: [CommonModule, RouterModule, LoginSignupComponent, LogoutButtonComponent]
})
export class SidebarModule {}
