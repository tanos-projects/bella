import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTableModule } from '@angular/material/table';
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
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatPaginatorModule],
})
export class PublicationsListComponent {
  public dialog = inject(MatDialog);

  @Input() publications: AdDTO[] = [];
  // 'pending': moderation queue (approve/reject/delete). 'published': live
  // ads a moderator can pull back down (dépublier), reusing archive().
  // 'archived': read-only audit view of REJECTED + ARCHIVED ads.
  @Input() mode: 'pending' | 'published' | 'archived' = 'pending';
  @Input() total = 0;
  @Input() pageSize = 20;
  @Input() pageIndex = 0;

  @Output() approbationDecision = new EventEmitter<ApprobationEvent>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  get displayedColumns(): string[] {
    return this.mode === 'archived'
      ? ['createdAt', 'title', 'owner', 'status', 'publishedAt', 'approbationMessage', 'moderatedBy']
      : ['createdAt', 'title', 'price', 'city', 'action'];
  }

  onApprove(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        // TODO make message configurable / translatable ?
        message: 'Êtes-vous sûr de vouloir approuver cette publication ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
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

  onUnpublish(row: AdDTO): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        message: 'Êtes-vous sûr de vouloir dépublier cette annonce ?',
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.askReason('Veuillez saisir le motif de dépublication').subscribe(
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

  statusLabel(status?: string): string {
    switch (status) {
      case 'REJECTED':
        return 'Rejetée';
      case 'ARCHIVED':
        return 'Supprimée / dépubliée';
      default:
        return status ?? '';
    }
  }

  ownerLabel(row: AdDTO): string {
    const owner = row.owner;
    if (!owner) {
      return '—';
    }
    return owner.email ?? owner.username ?? '—';
  }
}
