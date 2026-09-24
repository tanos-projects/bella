import { OperatorFunction, map } from 'rxjs';

/**
 * Turns a possibly-null/undefined value into a thrown error, passing it
 * through unchanged otherwise.
 *
 * Used at controller call sites now that AdMapper/UserMapper (Phase 2,
 * sub-point 5) no longer throw NotFoundException/BadRequestException
 * themselves when handed a null model - deciding the HTTP status for
 * "not found"/"bad request" is the controller's job, not a mapper's.
 */
export function throwIfNullish<T>(
  createError: () => Error
): OperatorFunction<T, NonNullable<T>> {
  return map((value) => {
    if (value === null || value === undefined) {
      throw createError();
    }
    return value as NonNullable<T>;
  });
}
