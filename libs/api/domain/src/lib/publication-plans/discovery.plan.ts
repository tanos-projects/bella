import { PublicationPlan, RenewalDecision } from './publication-plan';

const A_DAY_IN_MS = 24 * 60 * 60 * 1000;

/**
 * The only plan bella has today: a fixed lifetime, renewed for free on
 * request. Everyone is on it until a paid plan exists.
 */
export class DiscoveryPlan implements PublicationPlan {
  readonly code = 'DISCOVERY';

  constructor(private readonly lifetimeDays = 30) {}

  expiryFrom(from: Date): Date {
    return new Date(from.getTime() + this.lifetimeDays * A_DAY_IN_MS);
  }

  renewal(): RenewalDecision {
    return { outcome: 'GRANTED' };
  }
}
