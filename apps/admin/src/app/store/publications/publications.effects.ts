import { Injectable, inject } from '@angular/core';
import { PaginatedResultDTO, AdDTO } from '@bella/dtos';
import { catchError, map, Observable, of, switchMap } from 'rxjs';

import { AdminPublicationsService } from '../../shared/services/publications.service';
import { ofType } from '../utils';
import {
  approveUnpublishedPublication,
  archivePublication,
  loadArchived,
  loadPublished,
  loadUnpublished,
  rejectPublication
} from './publications.action';
import { PublicationActionResult, PublicationsStore } from './publications.store';

@Injectable()
export class PublicationsEffects {
  private service = inject(AdminPublicationsService);

  start(store: PublicationsStore): void {
    store.actions$
      .pipe(
        ofType(loadUnpublished),
        switchMap(({ payload: { page, pageSize } }) =>
          this.loadPage(this.service.getUnplished(page, pageSize), 'unpublished')
        )
      )
      .subscribe({
        next: (result) => {
          if (result) {
            store.unpublishedLoaded(result);
          }
        },
      });

    store.actions$
      .pipe(
        ofType(loadPublished),
        switchMap(({ payload: { page, pageSize } }) =>
          this.loadPage(this.service.getPublished(page, pageSize), 'published')
        )
      )
      .subscribe({
        next: (result) => {
          if (result) {
            store.publishedLoaded(result);
          }
        },
      });

    store.actions$
      .pipe(
        ofType(loadArchived),
        switchMap(({ payload: { page, pageSize } }) =>
          this.loadPage(this.service.getArchived(page, pageSize), 'archived')
        )
      )
      .subscribe({
        next: (result) => {
          if (result) {
            store.archivedLoaded(result);
          }
        },
      });

    // catchError lives *inside* each switchMap's inner pipe on purpose: an
    // uncaught error there would otherwise terminate this whole
    // store.actions$ subscription (RxJS switchMap semantics), silently
    // disabling that button for the rest of the session after one failure.
    store.actions$
      .pipe(
        ofType(approveUnpublishedPublication),
        switchMap(({ payload: { publicationId } }) =>
          this.toActionResult(this.service.approve(publicationId), 'approve')
        )
      )
      .subscribe({ next: (result) => this.handleActionResult(store, result) });

    store.actions$
      .pipe(
        ofType(rejectPublication),
        switchMap(({ payload: { publicationId, reason } }) =>
          this.toActionResult(
            this.service.reject(publicationId, reason),
            'reject'
          )
        )
      )
      .subscribe({ next: (result) => this.handleActionResult(store, result) });

    store.actions$
      .pipe(
        ofType(archivePublication),
        switchMap(({ payload: { publicationId, reason } }) =>
          this.toActionResult(
            this.service.archive(publicationId, reason),
            'archive'
          )
        )
      )
      .subscribe({ next: (result) => this.handleActionResult(store, result) });
  }

  private loadPage(
    call$: Observable<PaginatedResultDTO<AdDTO>>,
    label: string
  ): Observable<PaginatedResultDTO<AdDTO> | null> {
    return call$.pipe(
      catchError((error) => {
        console.error(`Failed to load ${label} publications`, error);
        return of(null);
      })
    );
  }

  private toActionResult(
    call$: Observable<unknown>,
    action: PublicationActionResult['action']
  ): Observable<PublicationActionResult> {
    return call$.pipe(
      map((): PublicationActionResult => ({ action, success: true })),
      catchError((error) => of<PublicationActionResult>({ action, success: false, error }))
    );
  }

  // Approve only ever touches the pending queue. Reject lands an ad in the
  // archived (audit) tab from the pending queue. Archive is reused both as
  // "supprimer" from the pending queue and as "dépublier" from the
  // published tab (see AdsService.archive() in the domain layer - it
  // transitions from ANY status by design), so it may affect either list;
  // reload every list a successful action could plausibly have touched
  // rather than tracking which tab triggered it.
  private handleActionResult(
    store: PublicationsStore,
    result: PublicationActionResult
  ): void {
    if (result.success) {
      const unpublished = store.currentUnpublished;
      store.dispatch(
        loadUnpublished({ page: unpublished.page, pageSize: unpublished.pageSize })
      );
      if (result.action === 'reject' || result.action === 'archive') {
        const archived = store.currentArchived;
        store.dispatch(
          loadArchived({ page: archived.page, pageSize: archived.pageSize })
        );
      }
      if (result.action === 'archive') {
        const published = store.currentPublished;
        store.dispatch(
          loadPublished({ page: published.page, pageSize: published.pageSize })
        );
      }
    }
    store.publishActionResult(result);
  }
}
