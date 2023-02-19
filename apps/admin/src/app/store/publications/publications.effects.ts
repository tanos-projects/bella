import { Injectable } from '@angular/core';
import { of, switchMap, tap } from 'rxjs';

import { AdminPublicationsService } from '../../shared/services/publications.service';
import { ofType } from '../utils';
import {
  approveUnpublishedPublication,
  loadUnpublished,
} from './publications.action';
import { PublicationsStore } from './publications.store';

@Injectable()
export class PublicationsEffects {
  constructor(private service: AdminPublicationsService) {}

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
  }
}
