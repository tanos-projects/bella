/**
 * Raised when a status transition is asked for an ad that is not in the state
 * the transition starts from — including when no such ad exists at all.
 *
 * Framework-free on purpose: the domain layer must not depend on Nest, so
 * controllers are responsible for translating this into an HTTP response.
 */
export class AdNotInExpectedStateError extends Error {
  constructor(readonly adId: string, readonly expectedStatus: string) {
    super(`Ad ${adId} was not found in the expected ${expectedStatus} state`);
    this.name = 'AdNotInExpectedStateError';
  }
}
