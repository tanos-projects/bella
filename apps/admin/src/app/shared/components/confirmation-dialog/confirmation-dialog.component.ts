import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  message?: string;
  title?: string;
}

@Component({
  selector: 'bella-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class ConfirmationDialogComponent {
  public dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  public data = inject<DialogData>(MAT_DIALOG_DATA);
}
