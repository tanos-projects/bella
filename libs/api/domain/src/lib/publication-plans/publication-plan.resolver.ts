import { AdEntity } from '../ads/ad.entity';
import { PublicationPlan } from './publication-plan';

/**
 * Resolves which plan applies to a given ad. Today it always returns the
 * same plan; a paid-plan resolver would read the owner's subscription
 * instead, without the ads domain service knowing the difference.
 */
export interface PublicationPlanResolver {
  resolveFor(ad: AdEntity): PublicationPlan;
}
