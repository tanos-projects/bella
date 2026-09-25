import { AdEntity } from '../ads/ad.entity';

/**
 * A decision on a renewal request, expressed as a discriminated union so a
 * future outcome (e.g. a paid plan requiring payment) can be added as a new
 * variant without changing the shape callers already handle.
 */
export type RenewalDecision =
  | { readonly outcome: 'GRANTED' }
  | { readonly outcome: 'REFUSED'; readonly reason: string };

/**
 * The extension point for "how long does a publication stay live, and can
 * it be renewed" — the two rules a commercial plan governs. `DiscoveryPlan`
 * is the only implementation today; a paid plan is a second implementation
 * of this same interface, not a change to the ads domain service.
 */
export interface PublicationPlan {
  readonly code: string;
  /** The instant a publication started at `from` stops being visible. */
  expiryFrom(from: Date): Date;
  renewal(ad: AdEntity, now: Date): RenewalDecision;
}
