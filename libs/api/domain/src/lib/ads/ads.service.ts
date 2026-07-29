import { Observable, OperatorFunction, throwError } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { AdEntity, AdStatus } from './ad.entity';
import { AdNotInExpectedStateError } from './ads.errors';
import { AdsRepository } from './ads.repository';
import { FilterCriteria, FilterOptions } from './models';
import { UserEntity } from '../users/user.entity';

/** Marks a transition that any existing ad may take, whatever its status. */
const ANY_STATUS = 'any';

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

  findAllByOwner(
    owner?: UserEntity,
    filter?: FilterCriteria,
    options?: FilterOptions,
  ): Observable<AdEntity[]> {
    return this.adsRepository.findAll(
      { ...filter, ...{owner: owner} },
      options,
    );
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

  submit(id: string): Observable<AdEntity> {
    return this.adsRepository
      .findOneDraft(id)
      .pipe(this.transitionTo(id, AdStatus.DRAFT, AdStatus.SUBMITTED));
  }

  publish(id: string): Observable<AdEntity> {
    // TODO => Should be APPROVED before PUBLISHED
    return this.adsRepository
      .findOneUnpublished(id)
      .pipe(this.transitionTo(id, AdStatus.SUBMITTED, AdStatus.PUBLISHED));
  }

  reject(id: string, approbationMessage: string): Observable<AdEntity> {
    // Rejection is not restricted to a starting state — only the ad's
    // existence is required, which is what findOne checks.
    return this.adsRepository
      .findOne(id)
      .pipe(this.transitionTo(id, ANY_STATUS, AdStatus.REJECTED, approbationMessage));
  }

  archive(id: string, approbationMessage: string): Observable<AdEntity> {
    return this.adsRepository
      .findOne(id)
      .pipe(this.transitionTo(id, ANY_STATUS, AdStatus.ARCHIVED, approbationMessage));
  }

  /**
   * Guards a status transition on the lookup that precedes it.
   *
   * The lookup returns null when the ad does not exist, or exists in a
   * different state than the one the transition starts from. Without this
   * check the update still ran: spreading a null lookup yields `{}` in
   * JavaScript, so the transition silently applied to whatever state the ad
   * was actually in — a DRAFT could be published directly.
   *
   * Only the changed fields are written, so a stale read is never written
   * back over concurrent updates.
   */
  private transitionTo(
    id: string,
    expectedStatus: string,
    nextStatus: AdStatus,
    approbationMessage?: string
  ): OperatorFunction<AdEntity, AdEntity> {
    return concatMap((ad: AdEntity) => {
      if (!ad) {
        return throwError(
          () => new AdNotInExpectedStateError(id, expectedStatus)
        );
      }
      const update: Partial<AdEntity> = { status: nextStatus };
      if (approbationMessage !== undefined) {
        update.approbationMessage = approbationMessage;
      }
      return this.adsRepository.updateOne(id, update);
    });
  }
}
