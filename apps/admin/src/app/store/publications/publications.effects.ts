import { Injectable, inject } from '@angular/core';
import { switchMap } from 'rxjs';

import { AdminPublicationsService } from '../../shared/services/publications.service';
import { ofType } from '../utils';
import {
  approveUnpublishedPublication,
  archivePublication,
  loadUnpublished,
  rejectPublication
} from './publications.action';
import { PublicationsStore } from './publications.store';

@Injectable()
export class PublicationsEffects {
  private service = inject(AdminPublicationsService);

  start(store: PublicationsStore): void {
    console.log('Init effects');

    store.actions$
      .pipe(
        ofType(loadUnpublished),
        switchMap((x) => this.service.getUnplished())
      )
      .subscribe({
        next: (publications) => store.unpublishedLoaded(publications),
      });

    store.actions$
      .pipe(
        ofType(approveUnpublishedPublication),
        switchMap(({ payload: { publicationId } }) => {
          return this.service.approve(publicationId);
        })
      )
      .subscribe({
        next: () => store.dispatch(loadUnpublished()),
      });

    store.actions$
      .pipe(
        ofType(rejectPublication),
        switchMap(({ payload: { publicationId, reason } }) => {
          return this.service.reject(publicationId, reason);
        })
      )
      .subscribe({
        next: () => store.dispatch(loadUnpublished()),
      });

    store.actions$
      .pipe(
        ofType(archivePublication),
        switchMap(({ payload: { publicationId, reason } }) => {
          return this.service.archive(publicationId, reason);
        })
      )
      .subscribe({
        next: () => store.dispatch(loadUnpublished()),
      });
  }
}
