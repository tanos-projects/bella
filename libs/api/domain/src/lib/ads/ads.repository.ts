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
  findAllByUserId(userId: string): Observable<AdEntity[]>;
  findOne(id: string): Observable<AdEntity>;
  findOnePublished(id: string): Observable<AdEntity>;
  findOneUnpublished(id: string): Observable<AdEntity>;
  findOneDraft(id: string): Observable<AdEntity>;
}
