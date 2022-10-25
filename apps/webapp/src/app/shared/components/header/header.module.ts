import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header.component';
import { LoginSignupModule } from '../buttons/login-signup/login-signup.module';
import { LogoutButtonModule } from '../buttons/logout/logout-button.module';
import { RouterModule } from '@angular/router';
import { SearchFilterButtonModule } from '../search-filter-button/search-filter-button.module';

@NgModule({
  declarations: [HeaderComponent],
  exports: [HeaderComponent],
  imports: [CommonModule, RouterModule, LoginSignupModule, LogoutButtonModule, SearchFilterButtonModule]
})
export class HeaderModule {}
