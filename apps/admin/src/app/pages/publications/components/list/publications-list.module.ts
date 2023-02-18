import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ConfirmationDialogModule } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.module';

import { PublicationsListComponent } from './publications-list.component';

@NgModule({
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    ConfirmationDialogModule,
  ],
  exports: [PublicationsListComponent],
  declarations: [PublicationsListComponent],
  providers: [],
})
export class PublicationsListModule {}
