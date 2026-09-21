import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';

import { PublicationsActions } from '../../store/publications/publications.action';
import { PublicationsState } from '../../store/publications/publications.state';
import {
  ApprobationEvent,
  ApprobationEventType,
} from './components/list/publications-list.component';

@Component({
  selector: 'bella-publications',
  templateUrl: './publications.component.html',
  standalone: false,
})
export class PublicationsComponent implements OnInit {
  unpublishedPublications$ = this.state.unpublished$.pipe(
    map((publications) =>
      publications.map((publication) => ({
        ...publication,
        createdAt: new Date(publication.createdAt ?? ''),
      }))
    )
  );

  constructor(
    private state: PublicationsState,
    private actions: PublicationsActions
  ) {
    this.actions.loadUnpublished();
  }

  ngOnInit(): void {
    console.log('Init!');
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
