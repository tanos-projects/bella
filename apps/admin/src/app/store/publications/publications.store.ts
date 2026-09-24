import { Injectable, inject } from '@angular/core';
import { AdDTO, PaginatedResultDTO } from '@bella/dtos';
import { BehaviorSubject, Subject } from 'rxjs';
import { PublicationsEffects } from './publications.effects';

export interface StoreAction<T> {
  type: string;
  payload?: T;
}

export type PublicationActionKind = 'approve' | 'reject' | 'archive';

export interface PublicationActionResult {
  action: PublicationActionKind;
  success: boolean;
  error?: unknown;
}

export interface PublicationsListState {
  items: AdDTO[];
  page: number;
  pageSize: number;
  total: number;
}

const EMPTY_LIST_STATE: PublicationsListState = {
  items: [],
  page: 1,
  pageSize: 20,
  total: 0,
};

function toListState(result: PaginatedResultDTO<AdDTO>): PublicationsListState {
  return {
    items: result.items,
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  };
}

@Injectable()
export class PublicationsStore {
  private readonly _actions$ = new Subject<StoreAction<any>>();

  readonly actions$ = this._actions$.asObservable();

  private readonly _unpublishedLoaded$ = new BehaviorSubject<PublicationsListState>(EMPTY_LIST_STATE);

  readonly unpublished$ = this._unpublishedLoaded$.asObservable();

  private readonly _publishedLoaded$ = new BehaviorSubject<PublicationsListState>(EMPTY_LIST_STATE);

  readonly published$ = this._publishedLoaded$.asObservable();

  private readonly _archivedLoaded$ = new BehaviorSubject<PublicationsListState>(EMPTY_LIST_STATE);

  readonly archived$ = this._archivedLoaded$.asObservable();

  private readonly _actionResult$ = new Subject<PublicationActionResult>();

  readonly actionResult$ = this._actionResult$.asObservable();

  private effects = inject(PublicationsEffects);

  constructor() {
    this.runEffects();
  }

  get currentUnpublished(): PublicationsListState {
    return this._unpublishedLoaded$.value;
  }

  get currentPublished(): PublicationsListState {
    return this._publishedLoaded$.value;
  }

  get currentArchived(): PublicationsListState {
    return this._archivedLoaded$.value;
  }

  unpublishedLoaded(result: PaginatedResultDTO<AdDTO>): void {
    this._unpublishedLoaded$.next(toListState(result));
  }

  publishedLoaded(result: PaginatedResultDTO<AdDTO>): void {
    this._publishedLoaded$.next(toListState(result));
  }

  archivedLoaded(result: PaginatedResultDTO<AdDTO>): void {
    this._archivedLoaded$.next(toListState(result));
  }

  publishActionResult(result: PublicationActionResult): void {
    this._actionResult$.next(result);
  }

  dispatch<T>(action: StoreAction<T>): void {
    this._actions$.next(action);
  }

  private runEffects(): void {
    this.effects.start(this);
  }
}
