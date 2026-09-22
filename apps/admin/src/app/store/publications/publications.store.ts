import { Injectable, inject } from '@angular/core';
import { AdDTO } from '@bella/dtos';
import { BehaviorSubject, Subject } from 'rxjs';
import { PublicationsEffects } from './publications.effects';

export interface StoreAction<T> {
  type: string;
  payload?: T;
}

@Injectable()
export class PublicationsStore {
  private readonly _actions$ = new Subject<StoreAction<any>>();

  readonly actions$ = this._actions$.asObservable();

  private readonly _unpublishedLoaded$ = new BehaviorSubject<AdDTO[]>([]);

  readonly unpublished$ = this._unpublishedLoaded$.asObservable();

  // Actions
  private readonly _loadUnpublishedAction$ = new BehaviorSubject<any>({});
  readonly loadUnpublishedAction$ = this._loadUnpublishedAction$.asObservable();

  private effects = inject(PublicationsEffects);

  constructor() {
    this.runEffects();
  }

  loadUnpublished(): void {
    console.log('Load unpublished action dispatch');
    this._loadUnpublishedAction$.next({ time: Date.now() });
  }

  unpublishedLoaded(publications: AdDTO[]): void {
    this._unpublishedLoaded$.next(publications);
  }

  dispatch<T>(action: StoreAction<T>): void {
    console.log(`Dispatch ${action.type}`);
    this._actions$.next(action);
  }

  private runEffects(): void {
    this.effects.start(this);
  }
}
