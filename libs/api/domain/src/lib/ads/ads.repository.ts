import { Observable } from 'rxjs';
import { AdEntity } from './ad.entity';
import { FilterCriteria, FilterOptions } from './models';

export interface AdsRepository {
  createNew(createAd: AdEntity): Observable<AdEntity>;
  updateOne(id: string, update: Partial<AdEntity>): Observable<AdEntity>;
  findAll(
    filter?: FilterCriteria,
    options?: FilterOptions,
  ): Observable<AdEntity[]>;
  count(filter?: FilterCriteria): Observable<number>;
  findAllByUserId(userId: string): Observable<AdEntity[]>;
  findOne(id: string): Observable<AdEntity>;
  findOnePublished(id: string): Observable<AdEntity>;
  findOneUnpublished(id: string): Observable<AdEntity>;
  findOneDraft(id: string): Observable<AdEntity>;
  /** Moves every PUBLISHED ad whose expiresAt has passed to EXPIRED. Returns the count moved. */
  expireDue(now: Date): Observable<number>;
  /**
   * Like updateOne, but only writes if the ad is currently in
   * expectedStatus — resolves null otherwise (including "not found"), so a
   * concurrent transition away from expectedStatus loses the race instead
   * of being overwritten.
   */
  updateOneInStatus(
    id: string,
    expectedStatus: string,
    update: Partial<AdEntity>
  ): Observable<AdEntity>;
}
