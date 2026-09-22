import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { AdDTO } from '@bella/dtos';
import { of } from 'rxjs';

import { ConfirmationDialogComponent } from '../../../../shared/components/confirmation-dialog/confirmation-dialog.component';

export enum ApprobationEventType {
  APPROVED,
  REJECTED,
  ARCHIVED,
}

export class ApprobationEvent {
  constructor(
    readonly publicationId: string,
    readonly type: ApprobationEventType,
    readonly message: string
  ) {}

  static buildApprovedEvent(publicationId: string): ApprobationEvent {
    return this.buildApprobationEvent(
      publicationId,
      ApprobationEventType.APPROVED,
      ''
    );
  }
  static buildRejectedEvent(
    publicationId: string,
    message: string
  ): ApprobationEvent {
    return this.buildApprobationEvent(
      publicationId,
      ApprobationEventType.REJECTED,
      message
    );
  }
  static buildArchivedEvent(
    publicationId: string,
    message: string
  ): ApprobationEvent {
    return this.buildApprobationEvent(
      publicationId,
      ApprobationEventType.ARCHIVED,
      message
    );
  }

  private static buildApprobationEvent(
    publicationId: string,
    type: ApprobationEventType,
    message: string
  ): ApprobationEvent {
    return new ApprobationEvent(publicationId, type, message);
  }
}

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
  standalone: false,
})
export class PublicationsListComponent {
  public dialog = inject(MatDialog);

  @Input() publications: AdDTO[] = [];

  @Output() approbationDecision = new EventEmitter<ApprobationEvent>();

  displayedColumns = ['createdAt', 'title', 'price', 'city', 'action'];
  // ngOnInit() {}

  onApprove(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        // TODO make message configurable / translatable ?
        message: 'Êtes-vous sûr de vouloir approuver cette publication ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Approve ', row.id);
        this.sendApprobationDecision(
          ApprobationEvent.buildApprovedEvent(row.id)
        );
      }
    });
  }

  private sendApprobationDecision(approbationEvent: ApprobationEvent) {
    this.approbationDecision.emit(approbationEvent);
  }

  onReject(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: { message: 'Êtes-vous sûr de vouloir rejeter cette publication ?' },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.askReason('Veuillez saisir le motif de refus').subscribe(
          (givenReason) => {
            console.log('Reject ', row.id, givenReason);

            this.sendApprobationDecision(
              ApprobationEvent.buildRejectedEvent(row.id, givenReason)
            );
          }
        );
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
        this.askReason('Veuillez saisir le motif de suppression').subscribe(
          (givenReason) => {
            this.sendApprobationDecision(
              ApprobationEvent.buildArchivedEvent(row.id, givenReason)
            );
          }
        );
      }
    });
  }

  private askReason(message: string) {
    return of(prompt(message) ?? '<NON_PRECISE>');
  }
}
