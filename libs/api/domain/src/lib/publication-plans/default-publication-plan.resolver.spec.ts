import { DefaultPublicationPlanResolver } from './default-publication-plan.resolver';
import { PublicationPlan } from './publication-plan';

describe('DefaultPublicationPlanResolver', () => {
  it('resolves every ad to the same plan', () => {
    const plan = {} as PublicationPlan;
    const resolver = new DefaultPublicationPlanResolver(plan);

    expect(resolver.resolveFor()).toBe(plan);
  });
});
