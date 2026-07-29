import { NotFoundException } from '@nestjs/common';
import { MonoTypeOperatorFunction, catchError, throwError } from 'rxjs';

import { AdNotInExpectedStateError } from '@bella/api/domain';

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
