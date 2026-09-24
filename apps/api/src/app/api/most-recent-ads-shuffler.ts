import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';

import { AdDTO } from '@bella/dtos';

/**
 * Extracted from `AdsController` (Phase 2, sub-point 3a) - the controller's
 * own TODO already flagged `shuffle()`/`fakeMostRecentAds()` as business/
 * presentation logic that didn't belong inline in a controller (SRP). Pure
 * extraction: behavior is unchanged, including the existing quirk where the
 * `limit` this class receives is not necessarily the endpoint's `?limit=`
 * query param (the controller still calls `fakeMostRecentAds(undefined)`
 * today, so `slice(0, limit)` never actually truncates the result).
 */
export class MostRecentAdsShuffler {
  fakeMostRecentAds(limit?: number): OperatorFunction<AdDTO[], AdDTO[]> {
    return map((ads: AdDTO[]) => this.shuffle(ads).slice(0, limit));
  }

  private shuffle<T>(array: Array<T>): Array<T> {
    return [...array].sort(() => Math.random() - 0.5);
  }
}
