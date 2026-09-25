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

/** Raised when a caller tries to renew an ad they don't own. */
export class AdNotOwnedError extends Error {
  constructor(readonly adId: string) {
    super(`Ad ${adId} is not owned by the requesting user`);
    this.name = 'AdNotOwnedError';
  }
}

/** Raised when the applicable PublicationPlan refuses a renewal request. */
export class AdRenewalRefusedError extends Error {
  constructor(readonly adId: string, readonly reason: string) {
    super(`Renewal of ad ${adId} was refused: ${reason}`);
    this.name = 'AdRenewalRefusedError';
  }
}
