import { filter, OperatorFunction } from 'rxjs';

import { StoreAction } from './publications/publications.store';

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

