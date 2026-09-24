import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { PaginatedResultDTO, AdDTO } from '@bella/dtos';

import { AdminPublicationsService } from '../../shared/services/publications.service';
import {
  approveUnpublishedPublication,
  archivePublication,
  loadArchived,
  loadPublished,
  loadUnpublished,
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

type MockedPublicationsService = jest.Mocked<
  Pick<
    AdminPublicationsService,
    'getUnplished' | 'getPublished' | 'getArchived' | 'approve' | 'reject' | 'archive'
  >
>;

function createServiceMock(): MockedPublicationsService {
  return {
    getUnplished: jest.fn(),
    getPublished: jest.fn(),
    getArchived: jest.fn(),
    approve: jest.fn(),
    reject: jest.fn(),
    archive: jest.fn(),
  };
}

function paginatedResult(
  page: number,
  pageSize: number
): PaginatedResultDTO<AdDTO> {
  return { items: [], total: 0, page, pageSize };
}

describe('PublicationsEffects — handleActionResult (characterization)', () => {
  // Locks the *current* selective-reload behavior described in the comment
  // above handleActionResult() in publications.effects.ts: approve only
  // ever touches the pending queue, reject additionally lands the ad in
  // the archived tab, and archive can affect any of the three lists.
  // Written before the Phase 4a console.log cleanup so that cleanup cannot
  // silently change this behavior.
  let effects: PublicationsEffects;
  let service: MockedPublicationsService;
  let store: FakeStore;

  beforeEach(() => {
    service = createServiceMock();

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

describe('PublicationsEffects — load effects', () => {
  let effects: PublicationsEffects;
  let service: MockedPublicationsService;
  let store: FakeStore;

  beforeEach(() => {
    service = createServiceMock();

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

  it('loads unpublished with the requested page/pageSize and forwards the result to the store', () => {
    const result = paginatedResult(2, 10);
    service.getUnplished.mockReturnValue(of(result));

    store.emit(loadUnpublished({ page: 2, pageSize: 10 }));

    expect(service.getUnplished).toHaveBeenCalledWith(2, 10);
    expect(store.unpublishedLoaded).toHaveBeenCalledWith(result);
  });

  it('loads published with the requested page/pageSize and forwards the result to the store', () => {
    const result = paginatedResult(3, 15);
    service.getPublished.mockReturnValue(of(result));

    store.emit(loadPublished({ page: 3, pageSize: 15 }));

    expect(service.getPublished).toHaveBeenCalledWith(3, 15);
    expect(store.publishedLoaded).toHaveBeenCalledWith(result);
  });

  it('loads archived with the requested page/pageSize and forwards the result to the store', () => {
    const result = paginatedResult(1, 20);
    service.getArchived.mockReturnValue(of(result));

    store.emit(loadArchived({ page: 1, pageSize: 20 }));

    expect(service.getArchived).toHaveBeenCalledWith(1, 20);
    expect(store.archivedLoaded).toHaveBeenCalledWith(result);
  });

  it('swallows a failed load and does not forward anything to the store, so one bad request does not kill the effect', () => {
    service.getUnplished.mockReturnValue(
      throwError(() => new Error('network error'))
    );
    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    store.emit(loadUnpublished({ page: 1, pageSize: 20 }));

    expect(store.unpublishedLoaded).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();

    // The subscription must still be alive for a subsequent action of the
    // same type — this is the behavior the comment in loadPage()'s
    // catchError exists to guarantee.
    const secondResult = paginatedResult(1, 20);
    service.getUnplished.mockReturnValue(of(secondResult));
    store.emit(loadUnpublished({ page: 1, pageSize: 20 }));
    expect(store.unpublishedLoaded).toHaveBeenCalledWith(secondResult);

    consoleErrorSpy.mockRestore();
  });
});
