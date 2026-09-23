import { Injectable, inject } from '@angular/core';

import { creationAction, props } from '../utils';
import { PublicationsStore } from './publications.store';

export interface PageRequest {
  page: number;
  pageSize: number;
}

export const loadUnpublished = creationAction(
  'LOAD_UNPUBLISHED',
  props<PageRequest>()
);

export const loadPublished = creationAction(
  'LOAD_PUBLISHED',
  props<PageRequest>()
);

export const loadArchived = creationAction(
  'LOAD_ARCHIVED',
  props<PageRequest>()
);

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

const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class PublicationsActions {
  private store = inject(PublicationsStore);

  approveUnpublishedPublication(publicationId: string) {
    this.store.dispatch(approveUnpublishedPublication({ publicationId }));
  }

  loadUnpublished(page = 1, pageSize = DEFAULT_PAGE_SIZE): void {
    this.store.dispatch(loadUnpublished({ page, pageSize }));
  }

  loadPublished(page = 1, pageSize = DEFAULT_PAGE_SIZE): void {
    this.store.dispatch(loadPublished({ page, pageSize }));
  }

  loadArchived(page = 1, pageSize = DEFAULT_PAGE_SIZE): void {
    this.store.dispatch(loadArchived({ page, pageSize }));
  }

  rejectPublication(publicationId: string, reason: string) {
    this.store.dispatch(rejectPublication({ publicationId, reason }));
  }
  archivePublication(publicationId: string, reason: string) {
    this.store.dispatch(archivePublication({ publicationId, reason }));
  }
}
