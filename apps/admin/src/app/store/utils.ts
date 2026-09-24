import { filter, OperatorFunction } from 'rxjs';

import { StoreAction } from './publications/publications.store';

// This hand-rolled Subject/BehaviorSubject store, with its own
// dispatch()/ofType() rather than @ngrx/store or @ngrx/signals, is an
// assumed choice, not an oversight: only one component in the whole admin
// app touches the store system, and only through two thin facades
// (PublicationsState/PublicationsActions), with no functional bug found —
// a full NgRx migration isn't worth the risk on a continuously-visible
// moderation flow for a benefit that's principle-only today (see
// CHANTIER-MODERNISATION.md §4 Phase 4 and §8). Revisit if a second store
// ever appears in admin.

export function props<T>(): T {
  const result = {} as T;
  const payload: T = {} as T;
  for (const k in payload) {
    result[k] = payload[k];
  }
  return result;
}

type ActionCreator<T> = (payload?: T) => StoreAction<T>;

export function creationAction<P>(
  type: string,
  payloadForType?: P
): ActionCreator<P> {
  return (payload?: P) => ({ type, payload });
}

export function ofType<T extends string | (() => StoreAction<any>)>(
  // actions: Array<StoreAction<V>>,
  action: T
): OperatorFunction<StoreAction<any>, any> {
  return concatMapToExpectedAction(inferActionType<T>(action));
}

function inferActionType<T extends string | (() => StoreAction<any>)>(
  actionToFind: T
): string {
  let actionType: string;
  if (typeof actionToFind === 'string') {
    actionType = actionToFind;
  } else {
    actionType = actionToFind().type;
  }
  return actionType;
}

function concatMapToExpectedAction<T>(
  actionType: string
): OperatorFunction<StoreAction<any>, any> {
  return filter((action) => action.type === actionType);
}

