import { AdDTO } from '../models/ads.model';
import { ContactService } from './contact.service';

// ContactService performs no HTTP call at all (pure derivation from an
// already-fetched AdDTO): there is no HTTP error path to cover, so the
// "error" case the phase requires is this service's actual failure mode
// instead — missing/incomplete input — rather than a manufactured HTTP
// failure that couldn't occur here.
describe('ContactService', () => {
  let service: ContactService;

  const owner = { mobilePhone: '+225000000', email: 'owner@example.com' };

  beforeEach(() => {
    service = new ContactService();
  });

  it('extracts only the contact channels the ad enables (success case)', () => {
    const ad = {
      owner,
      contactSettings: { phone: true, whatsapp: true, email: false },
    } as AdDTO;

    expect(service.getContactData(ad)).toEqual({
      phone: owner.mobilePhone,
      whatsapp: owner.mobilePhone,
      email: undefined,
    });
  });

  it('returns an all-undefined contact when contactSettings is missing (failure case)', () => {
    const ad = { owner } as AdDTO;

    expect(service.getContactData(ad)).toEqual({
      phone: undefined,
      whatsapp: undefined,
      email: undefined,
    });
  });

  it('tolerates an undefined ad without throwing', () => {
    expect(service.getContactData(undefined as unknown as AdDTO)).toEqual({
      phone: undefined,
      whatsapp: undefined,
      email: undefined,
    });
  });
});
