import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdDTO } from '@bella/dtos';
import { of } from 'rxjs';

import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'bella-publications-list',
  templateUrl: './publications-list.component.html',
  styles: [
    `
      table {
        width: 100%;
      }
    `,
  ],
})
export class PublicationsListComponent {
  constructor(public dialog: MatDialog) {}

  @Input() items: AdDTO[] = [];

  displayedColumns = ['createdAt', 'title', 'price', 'city', 'action'];
  // ngOnInit() {}

  onApprove(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: 'Êtes-vous sûr de vouloir approuver cette publication ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Approve ', row.id);
      }
    });
  }
  onReject(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: 'Êtes-vous sûr de vouloir rejeter cette publication ?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const motifRequiredMessage = 'Veuillez saisir le motif de refus';
        this.askMotivation(motifRequiredMessage).subscribe((motif) => {
          console.log('Reject ', row.id, motif);
        });
      }
    });
  }

  onDelete(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: 'Êtes-vous sûr de vouloir supprimer cette publication ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.askMotivation('Veuillez saisir le motif de suppression').subscribe((motif) => {
          console.log('Delete ', row.id, motif);
        });
      }
    });
  }

  private askMotivation(motifRequiredMessage: string) {
    return of(prompt(motifRequiredMessage) ?? '<NON_PRECISE>');
  }
}
