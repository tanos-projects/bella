import { PublicationPlan } from './publication-plan';
import { PublicationPlanResolver } from './publication-plan.resolver';

/** Resolves every ad to the same plan. */
export class DefaultPublicationPlanResolver implements PublicationPlanResolver {
  constructor(private readonly plan: PublicationPlan) {}

  resolveFor(): PublicationPlan {
    return this.plan;
  }
}
