import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  message?: string;
  title?: string;
}

@Component({
  selector: 'bella-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ConfirmationDialogComponent {
  public dialogRef = inject<MatDialogRef<ConfirmationDialogComponent>>(MatDialogRef);
  public data = inject<DialogData>(MAT_DIALOG_DATA);

  message!: string;
}
