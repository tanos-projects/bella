import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AdEntity/*, AdStatus*/ } from './ad.entity';
import { AdsRepository } from './ads.repository';
import { FilterCriteria, FilterOptions } from './models';
import { UserEntity } from '../users/user.entity';


export class AdsService {
  constructor(protected adsRepository: AdsRepository) {}
  create(ad: AdEntity): Observable<AdEntity> {
    // FIXME : should not be published SUBMITTED
    return this.createAd(ad, 'PUBLISHED');
  }

  createDraft(ad: AdEntity): Observable<AdEntity> {
    return this.createAd(ad, 'DRAFT');
  }

  private createAd(ad: AdEntity, status: string /*AdStatus*/) {
    return this.adsRepository.createNew({
      ...ad,
      status,
    });
  }

  findAll(): Observable<AdEntity[]> {
    return this.adsRepository.findAll();
  }

  findAllPublished(
    filter?: FilterCriteria,
    options?: FilterOptions,
  ): Observable<AdEntity[]> {
    if (filter.category === 'top' || !filter.category) {
      delete filter['category'];
    }
    return this.adsRepository.findAll(
      { ...filter, status: 'PUBLISHED' },
      options,
    );
  }

  findAllUnpublished(): Observable<AdEntity[]> {
    return this.adsRepository.findAll({ status: 'SUBMITTED' });
  }

  findAllByOwner(
    owner?: UserEntity,
    filter?: FilterCriteria,
    options?: FilterOptions,
  ): Observable<AdEntity[]> {
    return this.adsRepository.findAll(
      { ...filter, ...{owner: owner}, status: 'PUBLISHED' },
      options,
    );
  }

  findOne(id: string): Observable<AdEntity> {
    return this.adsRepository.findOne(id);
  }

  // findOnePublished(id: string): Observable<AdEntity> {
  //   return this.adsRepository.findOnePublished(id);
  // }

  findOneUnpublished(id: string): Observable<AdEntity> {
    return this.adsRepository.findOneUnpublished(id);
  }

  // FIXME : comportement un peu bizarre à tester et corriger
  submit(id: string): Observable<AdEntity> {
    return this.adsRepository.findOneDraft(id).pipe(
      concatMap((ad) => {
        return this.adsRepository.updateOne(id, {
          ...ad,
          status: 'SUBMITTED',
        });
      }),
    );
  }

  // FIXME : comportement un peu bizarre à tester et corriger
  publish(id: string): Observable<AdEntity> {
    return this.adsRepository.findOneUnpublished(id).pipe(
      concatMap((ad) => {
        return this.adsRepository.updateOne(id, {
          ...ad,
          status: 'PUBLISHED',
        });
      }),
    );
  }
}
