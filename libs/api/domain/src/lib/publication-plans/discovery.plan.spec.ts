import { DiscoveryPlan } from './discovery.plan';

describe('DiscoveryPlan', () => {
  describe('expiryFrom', () => {
    it('adds the lifetime in days to the given instant', () => {
      const plan = new DiscoveryPlan(30);
      const from = new Date('2026-01-01T00:00:00.000Z');

      expect(plan.expiryFrom(from)).toEqual(new Date('2026-01-31T00:00:00.000Z'));
    });

    it('defaults to a 30 day lifetime', () => {
      const plan = new DiscoveryPlan();
      const from = new Date('2026-01-01T00:00:00.000Z');

      expect(plan.expiryFrom(from)).toEqual(new Date('2026-01-31T00:00:00.000Z'));
    });
  });

  describe('renewal', () => {
    it('always grants the renewal, for free', () => {
      const plan = new DiscoveryPlan();

      expect(plan.renewal()).toEqual({ outcome: 'GRANTED' });
    });
  });
});
