import { of } from 'rxjs';

import { MostRecentAdsShuffler } from './most-recent-ads-shuffler';

describe('MostRecentAdsShuffler', () => {
  let shuffler: MostRecentAdsShuffler;

  beforeEach(() => {
    shuffler = new MostRecentAdsShuffler();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns the same set of ads, order aside, when limit is undefined', (done) => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const ads: any[] = [{ id: '1' }, { id: '2' }, { id: '3' }];

    of(ads)
      .pipe(shuffler.fakeMostRecentAds(undefined))
      .subscribe((result) => {
        expect(result).toHaveLength(3);
        expect(result.map((ad) => ad.id).sort()).toEqual(['1', '2', '3']);
        done();
      });
  });

  it('truncates to the given limit', (done) => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    const ads: any[] = [{ id: '1' }, { id: '2' }, { id: '3' }];

    of(ads)
      .pipe(shuffler.fakeMostRecentAds(2))
      .subscribe((result) => {
        expect(result).toHaveLength(2);
        done();
      });
  });

  it('does not mutate the input array', (done) => {
    const ads: any[] = [{ id: '1' }, { id: '2' }, { id: '3' }];
    const originalOrder = [...ads];

    of(ads)
      .pipe(shuffler.fakeMostRecentAds(undefined))
      .subscribe(() => {
        expect(ads).toEqual(originalOrder);
        done();
      });
  });
});
