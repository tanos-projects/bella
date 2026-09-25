import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';

import {
  AdNotInExpectedStateError,
  AdNotOwnedError,
  AdRenewalRefusedError,
} from '@bella/api/domain';

/**
 * Translates the domain's transition guard into an HTTP 404.
 *
 * The domain layer is framework-free, so it signals "no ad in the state this
 * transition starts from" with its own error type; turning that into a status
 * code is the controller's job.
 */
export function mapAdTransitionError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error) =>
    throwError(() =>
      error instanceof AdNotInExpectedStateError
        ? new NotFoundException(error.message)
        : error
    )
  );
}

/**
 * Same as mapAdTransitionError, extended with the ownership/plan-refusal
 * errors only renew() can raise. Kept separate so publish/reject/archive's
 * existing 404-only contract, already covered by tests, doesn't change.
 */
export function mapAdDomainError<T>(): MonoTypeOperatorFunction<T> {
  return catchError((error) => {
    if (error instanceof AdNotInExpectedStateError) {
      return throwError(() => new NotFoundException(error.message));
    }
    if (error instanceof AdNotOwnedError) {
      return throwError(() => new ForbiddenException(error.message));
    }
    if (error instanceof AdRenewalRefusedError) {
      return throwError(
        () => new ConflictException({ message: error.message, reason: error.reason })
      );
    }
    return throwError(() => error);
  });
}
