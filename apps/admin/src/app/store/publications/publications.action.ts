import { Injectable } from '@angular/core';

import { creationAction, props } from '../utils';
import { PublicationsStore } from './publications.store';

export const loadUnpublished = creationAction('LOAD_UNPUBLISHED');

export const approveUnpublishedPublication = creationAction(
  'APPROVE_UNPUBLISHED_PUBLICATION',
  props<{ publicationId: string }>()
);

export const rejectPublication = creationAction(
  'REJECT_PUBLICATION',
  props<{ publicationId: string, reason: string }>()
);
export const archivePublication = creationAction(
  'ARCHIVE_PUBLICATION',
  props<{ publicationId: string, reason: string }>()
);

@Injectable()
export class PublicationsActions {
  constructor(private store: PublicationsStore) {}

  approveUnpublishedPublication(publicationId: string) {
    this.store.dispatch(approveUnpublishedPublication({ publicationId }));
  }

  loadUnpublished(): void {
    this.store.dispatch(loadUnpublished());
  }

  rejectPublication(publicationId: string, reason: string) {
    this.store.dispatch(rejectPublication({ publicationId, reason }));
  }
  archivePublication(publicationId: string, reason: string) {
    this.store.dispatch(archivePublication({ publicationId, reason }));
  }
}
