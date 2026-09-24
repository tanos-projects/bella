import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { AdminPublicationsService } from '../../shared/services/publications.service';
import {
  approveUnpublishedPublication,
  archivePublication,
  rejectPublication,
} from './publications.action';
import { PublicationsEffects } from './publications.effects';
import {
  PublicationsListState,
  PublicationsStore,
  StoreAction,
} from './publications.store';

// Minimal stand-in for PublicationsStore: PublicationsEffects.start() only
// ever touches the members listed here, so this fake avoids pulling in the
// real store's own constructor (which would in turn re-inject
// PublicationsEffects and start a second, unrelated effects run).
class FakeStore {
  private readonly _actions$ = new Subject<StoreAction<unknown>>();
  readonly actions$ = this._actions$.asObservable();

  currentUnpublished: PublicationsListState = {
    items: [],
    page: 1,
    pageSize: 20,
    total: 0,
  };
  currentPublished: PublicationsListState = {
    items: [],
    page: 2,
    pageSize: 20,
    total: 0,
  };
  currentArchived: PublicationsListState = {
    items: [],
    page: 3,
    pageSize: 20,
    total: 0,
  };

  unpublishedLoaded = jest.fn();
  publishedLoaded = jest.fn();
  archivedLoaded = jest.fn();
  publishActionResult = jest.fn();
  dispatch = jest.fn();

  emit(action: StoreAction<unknown>): void {
    this._actions$.next(action);
  }
}

describe('PublicationsEffects — handleActionResult (characterization)', () => {
  // Locks the *current* selective-reload behavior described in the comment
  // above handleActionResult() in publications.effects.ts: approve only
  // ever touches the pending queue, reject additionally lands the ad in
  // the archived tab, and archive can affect any of the three lists.
  // Written before the Phase 4a console.log cleanup so that cleanup cannot
  // silently change this behavior.
  let effects: PublicationsEffects;
  let service: jest.Mocked<
    Pick<AdminPublicationsService, 'approve' | 'reject' | 'archive'>
  >;
  let store: FakeStore;

  beforeEach(() => {
    service = {
      approve: jest.fn(),
      reject: jest.fn(),
      archive: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PublicationsEffects,
        { provide: AdminPublicationsService, useValue: service },
      ],
    });

    effects = TestBed.inject(PublicationsEffects);
    store = new FakeStore();
    effects.start(store as unknown as PublicationsStore);
  });

  it('approve reloads only the unpublished list on success', () => {
    service.approve.mockReturnValue(of(undefined));

    store.emit(approveUnpublishedPublication({ publicationId: 'ad-1' }));

    expect(store.dispatch).toHaveBeenCalledTimes(1);
    expect(store.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'LOAD_UNPUBLISHED' })
    );
    expect(store.publishActionResult).toHaveBeenCalledWith({
      action: 'approve',
      success: true,
    });
  });

  it('reject reloads the unpublished and archived lists, but not published, on success', () => {
    service.reject.mockReturnValue(of(undefined));

    store.emit(
      rejectPublication({ publicationId: 'ad-1', reason: 'spam' })
    );

    expect(store.dispatch).toHaveBeenCalledTimes(2);
    const dispatchedTypes = store.dispatch.mock.calls.map(
      ([action]) => (action as StoreAction<unknown>).type
    );
    expect(dispatchedTypes).toEqual(
      expect.arrayContaining(['LOAD_UNPUBLISHED', 'LOAD_ARCHIVED'])
    );
    expect(dispatchedTypes).not.toContain('LOAD_PUBLISHED');
    expect(store.publishActionResult).toHaveBeenCalledWith({
      action: 'reject',
      success: true,
    });
  });

  it('archive reloads all three lists (unpublished, archived and published) on success', () => {
    service.archive.mockReturnValue(of(undefined));

    store.emit(
      archivePublication({ publicationId: 'ad-1', reason: 'depublier' })
    );

    expect(store.dispatch).toHaveBeenCalledTimes(3);
    const dispatchedTypes = store.dispatch.mock.calls.map(
      ([action]) => (action as StoreAction<unknown>).type
    );
    expect(dispatchedTypes).toEqual(
      expect.arrayContaining([
        'LOAD_UNPUBLISHED',
        'LOAD_ARCHIVED',
        'LOAD_PUBLISHED',
      ])
    );
    expect(store.publishActionResult).toHaveBeenCalledWith({
      action: 'archive',
      success: true,
    });
  });

  it('does not reload anything when the action fails', () => {
    service.approve.mockReturnValue(throwError(() => new Error('boom')));

    store.emit(approveUnpublishedPublication({ publicationId: 'ad-1' }));

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(store.publishActionResult).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'approve', success: false })
    );
  });
});
