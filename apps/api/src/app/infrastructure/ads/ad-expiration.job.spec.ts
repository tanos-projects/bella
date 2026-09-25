import { of, throwError } from 'rxjs';
import { AdExpirationJob, isPrimaryInstance } from './ad-expiration.job';

describe('isPrimaryInstance', () => {
  it('is true when NODE_APP_INSTANCE is unset (single-instance / local dev)', () => {
    expect(isPrimaryInstance({})).toBe(true);
  });

  it('is true for instance 0', () => {
    expect(isPrimaryInstance({ NODE_APP_INSTANCE: '0' })).toBe(true);
  });

  it('is false for any other instance', () => {
    expect(isPrimaryInstance({ NODE_APP_INSTANCE: '1' })).toBe(false);
  });
});

describe('AdExpirationJob', () => {
  let adsService: { expireDue: jest.Mock };
  let job: AdExpirationJob;

  beforeEach(() => {
    adsService = { expireDue: jest.fn() };
    job = new AdExpirationJob(adsService as any);
  });

  it('delegates to AdsService.expireDue on the primary instance', () => {
    delete process.env.NODE_APP_INSTANCE;
    adsService.expireDue.mockReturnValue(of(2));

    job.handleExpiration();

    expect(adsService.expireDue).toHaveBeenCalled();
  });

  it('does nothing on a non-primary instance', () => {
    process.env.NODE_APP_INSTANCE = '1';

    job.handleExpiration();

    expect(adsService.expireDue).not.toHaveBeenCalled();
    delete process.env.NODE_APP_INSTANCE;
  });

  it('does not throw when expireDue errors', () => {
    delete process.env.NODE_APP_INSTANCE;
    adsService.expireDue.mockReturnValue(throwError(() => new Error('down')));

    expect(() => job.handleExpiration()).not.toThrow();
  });

  describe('onApplicationBootstrap', () => {
    it('runs the expiration check immediately, without waiting for the first tick', () => {
      delete process.env.NODE_APP_INSTANCE;
      adsService.expireDue.mockReturnValue(of(0));

      job.onApplicationBootstrap();

      expect(adsService.expireDue).toHaveBeenCalled();
    });

    it('still respects the primary-instance guard', () => {
      process.env.NODE_APP_INSTANCE = '1';

      job.onApplicationBootstrap();

      expect(adsService.expireDue).not.toHaveBeenCalled();
      delete process.env.NODE_APP_INSTANCE;
    });
  });
});
