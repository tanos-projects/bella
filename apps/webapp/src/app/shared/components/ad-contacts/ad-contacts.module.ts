import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdContactsComponent } from './ad-contacts.component';

@NgModule({
  declarations: [AdContactsComponent],
  exports: [AdContactsComponent],
  imports: [CommonModule]
})
export class AdContactsModule {}
