import { AuthUser } from '../../auth/auth-user.model';
import { UserSettingsService } from './user-settings.service';

// UserSettingsService performs no HTTP call: it is a BehaviorSubject +
// localStorage-backed store. There is no HTTP error path to cover, so the
// two required cases become "country set and persisted" vs. "country
// cleared" instead — its actual failure mode is a stale/missing
// localStorage entry, not a failed request.
describe('UserSettingsService', () => {
  const COUNTRY_ENTRY_KEY = 'user-country';

  afterEach(() => {
    window.localStorage.clear();
  });

  it('initialises from a previously persisted country (success case)', () => {
    window.localStorage.setItem(COUNTRY_ENTRY_KEY, 'SN');

    const service = new UserSettingsService();

    expect(service.getCountry()).toBe('SN');
    expect(service.hasCountrySet()).toBe(true);
  });

  it('persists a newly set country to localStorage and emits it on country$', () => {
    const service = new UserSettingsService();
    const emitted: string[] = [];
    service.country$.subscribe((value) => emitted.push(value));

    service.setCountry('CI');

    expect(service.getCountry()).toBe('CI');
    expect(window.localStorage.getItem(COUNTRY_ENTRY_KEY)).toBe('CI');
    expect(emitted).toContain('CI');
  });

  it('clears the persisted country when set to a falsy value (failure/edge case)', () => {
    const service = new UserSettingsService();
    service.setCountry('CI');

    service.setCountry(null);

    expect(service.getCountry()).toBe('');
    expect(service.hasCountrySet()).toBe(false);
    expect(window.localStorage.getItem(COUNTRY_ENTRY_KEY)).toBeNull();
  });

  it('reset() removes the persisted country entry directly', () => {
    window.localStorage.setItem(COUNTRY_ENTRY_KEY, 'CI');
    const service = new UserSettingsService();

    service.reset();

    expect(window.localStorage.getItem(COUNTRY_ENTRY_KEY)).toBeNull();
  });

  it('stores and retrieves the profile', () => {
    const service = new UserSettingsService();
    const profile: AuthUser = { id: '1', email: 'a@b.com' };

    service.setProfile(profile);

    expect(service.getProfile()).toEqual(profile);
  });
});
