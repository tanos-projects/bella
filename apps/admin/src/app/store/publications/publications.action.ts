import { Injectable } from '@angular/core';

import { creationAction, props } from '../utils';
import { PublicationsStore } from './publications.store';

export const loadUnpublished = creationAction('LOAD_UNPUBLISHED');

export const approveUnpublishedPublication = creationAction(
  'APPROVE_UNPUBLISHED_PUBLICATION',
  props<{ publicationId: string }>()
);

@Injectable()
export class PublicationsActions {
  approveUnpublishedPublication(publicationId: string) {
    this.store.dispatch(approveUnpublishedPublication({ publicationId }));
  }
  constructor(private store: PublicationsStore) {}

  loadUnpublished(): void {
    this.store.dispatch(loadUnpublished());
  }
}
