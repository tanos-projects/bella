import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { AdEntity, AdStatus } from './ad.entity';
import { AdsRepository } from './ads.repository';
import { FilterCriteria, FilterOptions } from './models';

export class AdsService {
  constructor(protected adsRepository: AdsRepository) {}
  create(ad: AdEntity): Observable<AdEntity> {
    return this.createAd(ad, AdStatus.SUBMITTED);
  }

  createDraft(ad: AdEntity): Observable<AdEntity> {
    return this.createAd(ad, AdStatus.DRAFT);
  }

  private createAd(ad: AdEntity, status: string /*AdStatus*/) {
    // TODO sanitize title and description (remove link or phone number)
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
    options?: FilterOptions
  ): Observable<AdEntity[]> {
    if (filter.category === 'top' || !filter.category) {
      delete filter['category'];
    }
    return this.adsRepository.findAll(
      { ...filter, status: AdStatus.PUBLISHED },
      options
    );
  }

  findAllUnpublished(): Observable<AdEntity[]> {
    return this.adsRepository.findAll({ status: AdStatus.SUBMITTED });
  }

  findOne(id: string): Observable<AdEntity> {
    return this.adsRepository.findOne(id);
  }

  findOnePublished(id: string): Observable<AdEntity> {
    return this.adsRepository.findOnePublished(id);
  }

  findOneUnpublished(id: string): Observable<AdEntity> {
    return this.adsRepository.findOneUnpublished(id);
  }

  // FIXME : comportement un peu bizarre à tester et corriger
  submit(id: string): Observable<AdEntity> {
    return this.adsRepository.findOneDraft(id).pipe(
      concatMap((ad) => {
        return this.adsRepository.updateOne(id, {
          ...ad,
          status: AdStatus.SUBMITTED,
        });
      })
    );
  }

  // FIXME : comportement un peu bizarre à tester et corriger
  publish(id: string): Observable<AdEntity> {
    // return this.adsRepository.findOneUnpublished(id).pipe(
    //   concatMap((ad) => {
    return this.adsRepository.updateOne(id, {
      // ...ad,
      status: AdStatus.PUBLISHED, // TODO => Should be APPROVED before PUBLISHED
    });
    //   })
    // );
  }

  reject(id: string, approbationMessage: string): Observable<AdEntity> {
    // return this.adsRepository.findOne(id).pipe(
    //   concatMap((ad) => {
    return this.adsRepository.updateOne(id, {
      // ...ad,
      approbationMessage,
      status: AdStatus.REJECTED,
    });
    //   })
    // );
  }

  archive(id: string, approbationMessage: string): Observable<AdEntity> {
    // return this.adsRepository.findOne(id).pipe(
    //   concatMap((ad) => {
    return this.adsRepository.updateOne(id, {
      // ...ad,
      approbationMessage,
      status: AdStatus.ARCHIVED,
    });
    //   })
    // );
  }
}
