import { Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';

import { PublicationsActions } from '../../store/publications/publications.action';
import { PublicationsState } from '../../store/publications/publications.state';
import { PublicationActionResult } from '../../store/publications/publications.store';
import {
  ApprobationEvent,
  ApprobationEventType,
} from './components/list/publications-list.component';

// 'archive' is reused both as "supprimer" from the pending queue and as
// "dépublier" from the published tab (same ARCHIVED transition either
// way - see PublicationsEffects), so its label stays neutral rather than
// implying one or the other.
const ACTION_LABELS: Record<PublicationActionResult['action'], string> = {
  approve: 'approuvée',
  reject: 'rejetée',
  archive: 'archivée',
};
const ACTION_VERBS: Record<PublicationActionResult['action'], string> = {
  approve: 'approuver',
  reject: 'rejeter',
  archive: 'archiver',
};

@Component({
  selector: 'bella-publications',
  templateUrl: './publications.component.html',
  standalone: false,
})
export class PublicationsComponent implements OnInit {
  private state = inject(PublicationsState);
  private actions = inject(PublicationsActions);
  private snackBar = inject(MatSnackBar);

  private static withDates<T extends { createdAt?: unknown }>(
    publications: T[]
  ) {
    return publications.map((publication) => ({
      ...publication,
      createdAt: new Date((publication.createdAt as string) ?? ''),
    }));
  }

  unpublished$ = this.state.unpublished$.pipe(
    map((state) => ({
      ...state,
      items: PublicationsComponent.withDates(state.items),
    }))
  );

  published$ = this.state.published$.pipe(
    map((state) => ({
      ...state,
      items: PublicationsComponent.withDates(state.items),
    }))
  );

  archived$ = this.state.archived$.pipe(
    map((state) => ({
      ...state,
      items: PublicationsComponent.withDates(state.items),
    }))
  );

  constructor() {
    this.actions.loadUnpublished();
    this.actions.loadPublished();
    this.actions.loadArchived();
    this.state.actionResult$
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.showActionFeedback(result));
  }

  ngOnInit(): void {
    console.log('Init!');
  }

  private showActionFeedback(result: PublicationActionResult): void {
    const message = result.success
      ? `Publication ${ACTION_LABELS[result.action]} avec succès.`
      : `Échec : impossible de ${ACTION_VERBS[result.action]} cette publication.`;
    this.snackBar.open(message, 'Fermer', { duration: 4000 });
  }

  onUnpublishedPageChange(event: PageEvent): void {
    this.actions.loadUnpublished(event.pageIndex + 1, event.pageSize);
  }

  onPublishedPageChange(event: PageEvent): void {
    this.actions.loadPublished(event.pageIndex + 1, event.pageSize);
  }

  onArchivedPageChange(event: PageEvent): void {
    this.actions.loadArchived(event.pageIndex + 1, event.pageSize);
  }

  onApprobationDecisionMaked(decision: ApprobationEvent) {
    switch (decision.type) {
      case ApprobationEventType.APPROVED: {
        this.actions.approveUnpublishedPublication(decision.publicationId);
        break;
      }
      case ApprobationEventType.REJECTED: {
        this.actions.rejectPublication(
          decision.publicationId,
          decision.message
        );
        break;
      }
      case ApprobationEventType.ARCHIVED: {
        this.actions.archivePublication(
          decision.publicationId,
          decision.message
        );
        break;
      }
      default:
        // nothing to do
        break;
    }
  }
}
