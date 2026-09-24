/**
 * Abstracts "now" so time-dependent domain logic (publication expiry) can be
 * tested with a fixed instant instead of the real system clock.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};
