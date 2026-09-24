import { TestBed } from '@angular/core/testing';
import { AdDTO, PaginatedResultDTO } from '@bella/dtos';
import { firstValueFrom, take, toArray } from 'rxjs';

import { PublicationsEffects } from './publications.effects';
import { PublicationActionResult, PublicationsStore } from './publications.store';

function paginatedResult(page: number): PaginatedResultDTO<AdDTO> {
  return { items: [], total: 0, page, pageSize: 20 };
}

describe('PublicationsStore', () => {
  let store: PublicationsStore;
  let effectsStart: jest.Mock;

  beforeEach(() => {
    effectsStart = jest.fn();

    TestBed.configureTestingModule({
      providers: [
        PublicationsStore,
        { provide: PublicationsEffects, useValue: { start: effectsStart } },
      ],
    });

    store = TestBed.inject(PublicationsStore);
  });

  it('starts the injected effects with itself on construction', () => {
    expect(effectsStart).toHaveBeenCalledTimes(1);
    expect(effectsStart).toHaveBeenCalledWith(store);
  });

  it('exposes an empty list state for unpublished/published/archived before anything loads', () => {
    expect(store.currentUnpublished).toEqual({
      items: [],
      page: 1,
      pageSize: 20,
      total: 0,
    });
    expect(store.currentPublished).toEqual(store.currentUnpublished);
    expect(store.currentArchived).toEqual(store.currentUnpublished);
  });

  it('dispatch() pushes the action onto actions$', async () => {
    const received = firstValueFrom(store.actions$.pipe(take(1)));

    store.dispatch({ type: 'SOME_ACTION', payload: { a: 1 } });

    await expect(received).resolves.toEqual({
      type: 'SOME_ACTION',
      payload: { a: 1 },
    });
  });

  it('unpublishedLoaded() updates both unpublished$ and currentUnpublished', async () => {
    const result = paginatedResult(2);

    store.unpublishedLoaded(result);

    expect(store.currentUnpublished).toEqual(result);
    await expect(
      firstValueFrom(store.unpublished$.pipe(take(1)))
    ).resolves.toEqual(result);
  });

  it('publishedLoaded() updates both published$ and currentPublished', async () => {
    const result = paginatedResult(3);

    store.publishedLoaded(result);

    expect(store.currentPublished).toEqual(result);
    await expect(
      firstValueFrom(store.published$.pipe(take(1)))
    ).resolves.toEqual(result);
  });

  it('archivedLoaded() updates both archived$ and currentArchived', async () => {
    const result = paginatedResult(4);

    store.archivedLoaded(result);

    expect(store.currentArchived).toEqual(result);
    await expect(
      firstValueFrom(store.archived$.pipe(take(1)))
    ).resolves.toEqual(result);
  });

  it('publishActionResult() emits the result on actionResult$', async () => {
    const result: PublicationActionResult = { action: 'approve', success: true };
    const received = firstValueFrom(store.actionResult$.pipe(take(1)));

    store.publishActionResult(result);

    await expect(received).resolves.toEqual(result);
  });

  it('unpublished$/published$/archived$ are BehaviorSubject-backed: a late subscriber gets the last value immediately', async () => {
    store.unpublishedLoaded(paginatedResult(5));

    const collected = await firstValueFrom(
      store.unpublished$.pipe(take(1), toArray())
    );

    expect(collected).toEqual([paginatedResult(5)]);
  });
});
