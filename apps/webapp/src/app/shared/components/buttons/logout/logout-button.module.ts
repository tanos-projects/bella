import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LogoutButtonComponent } from './logout-button.component';

@NgModule({
  declarations: [LogoutButtonComponent],
  imports: [CommonModule],
  exports: [LogoutButtonComponent]
})
export class LogoutButtonModule {}
