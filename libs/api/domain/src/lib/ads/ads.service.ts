import { Observable, of, OperatorFunction, throwError } from 'rxjs';
import { concatMap } from 'rxjs/operators';

import { AdEntity, AdStatus } from './ad.entity';
import {
  AdNotInExpectedStateError,
  AdNotOwnedError,
  AdRenewalRefusedError,
} from './ads.errors';
import { AdsRepository } from './ads.repository';
import { FilterCriteria, FilterOptions } from './models';
import { UserEntity } from '../users/user.entity';
import { Clock } from '../shared/clock';
import { PublicationPlanResolver } from '../publication-plans/publication-plan.resolver';

/** Marks a transition that any existing ad may take, whatever its status. */
const ANY_STATUS = 'any';

export class AdsService {
  constructor(
    protected adsRepository: AdsRepository,
    protected planResolver: PublicationPlanResolver,
    protected clock: Clock
  ) {}
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

  findAllUnpublished(options?: FilterOptions): Observable<AdEntity[]> {
    return this.adsRepository.findAll({ status: AdStatus.SUBMITTED }, options);
  }

  countUnpublished(): Observable<number> {
    return this.adsRepository.count({ status: AdStatus.SUBMITTED });
  }

  countPublished(filter?: FilterCriteria): Observable<number> {
    const filterToUse: FilterCriteria = { ...filter };
    if (filterToUse.category === 'top' || !filterToUse.category) {
      delete filterToUse['category'];
    }
    return this.adsRepository.count({ ...filterToUse, status: AdStatus.PUBLISHED });
  }

  // REJECTED and ARCHIVED are grouped into one "archived" audit view -
  // FilterCriteria is typed as Partial<AdEntity> (a single AdStatus per
  // field), so the $in query Mongo needs here is cast rather than
  // widening that type for one caller.
  findAllArchived(options?: FilterOptions): Observable<AdEntity[]> {
    return this.adsRepository.findAll(
      { status: { $in: [AdStatus.REJECTED, AdStatus.ARCHIVED] } } as unknown as FilterCriteria,
      options
    );
  }

  countArchived(): Observable<number> {
    return this.adsRepository.count(
      { status: { $in: [AdStatus.REJECTED, AdStatus.ARCHIVED] } } as unknown as FilterCriteria
    );
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

  /** Moves every PUBLISHED ad past its expiresAt to EXPIRED. Returns the count moved. */
  expireDue(): Observable<number> {
    return this.adsRepository.expireDue(this.clock.now());
  }

  publish(id: string, moderatedBy?: string): Observable<AdEntity> {
    // TODO => Should be APPROVED before PUBLISHED
    return this.adsRepository.findOneUnpublished(id).pipe(
      this.transitionTo(id, AdStatus.SUBMITTED, AdStatus.PUBLISHED, (ad) => {
        const now = this.clock.now();
        const plan = this.planResolver.resolveFor(ad);
        // Set once here and never rewritten by reject/archive's own
        // transitionTo calls, so a later status change doesn't erase when
        // the ad first went live.
        const extra: Partial<AdEntity> = {
          publishedAt: now,
          expiresAt: plan.expiryFrom(now),
        };
        if (moderatedBy !== undefined) {
          extra.moderatedBy = moderatedBy;
        }
        return extra;
      })
    );
  }

  reject(
    id: string,
    approbationMessage: string,
    moderatedBy?: string
  ): Observable<AdEntity> {
    // Rejection is not restricted to a starting state — only the ad's
    // existence is required, which is what findOne checks.
    return this.adsRepository.findOne(id).pipe(
      this.transitionTo(id, ANY_STATUS, AdStatus.REJECTED, () => {
        const extra: Partial<AdEntity> = { approbationMessage };
        if (moderatedBy !== undefined) {
          extra.moderatedBy = moderatedBy;
        }
        return extra;
      })
    );
  }

  archive(
    id: string,
    approbationMessage: string,
    moderatedBy?: string
  ): Observable<AdEntity> {
    return this.adsRepository.findOne(id).pipe(
      this.transitionTo(id, ANY_STATUS, AdStatus.ARCHIVED, () => {
        const extra: Partial<AdEntity> = { approbationMessage };
        if (moderatedBy !== undefined) {
          extra.moderatedBy = moderatedBy;
        }
        return extra;
      })
    );
  }

  /**
   * Lets an EXPIRED ad's owner ask for it to go live again. Ownership is
   * checked here (unlike publish's, which the controller checks) because
   * "only the owner renews" is itself the business rule being enforced, not
   * an authorization concern layered on top of one.
   */
  renew(id: string, requesterId: string): Observable<AdEntity> {
    return this.adsRepository.findOne(id).pipe(
      concatMap((ad) => {
        if (!ad) {
          return throwError(
            () => new AdNotInExpectedStateError(id, AdStatus.EXPIRED)
          );
        }
        if (!ad.owner || ad.owner.id !== requesterId) {
          return throwError(() => new AdNotOwnedError(id));
        }
        if (ad.status !== AdStatus.EXPIRED) {
          return throwError(
            () => new AdNotInExpectedStateError(id, AdStatus.EXPIRED)
          );
        }
        const now = this.clock.now();
        const plan = this.planResolver.resolveFor(ad);
        const decision = plan.renewal(ad, now);
        if (decision.outcome === 'REFUSED') {
          return throwError(
            () => new AdRenewalRefusedError(id, decision.reason)
          );
        }
        return this.adsRepository
          .updateOneInStatus(id, AdStatus.EXPIRED, {
            status: AdStatus.PUBLISHED,
            publishedAt: now,
            expiresAt: plan.expiryFrom(now),
          })
          .pipe(
            concatMap((updated) =>
              updated
                ? of(updated)
                : throwError(
                    () => new AdNotInExpectedStateError(id, AdStatus.EXPIRED)
                  )
            )
          );
      })
    );
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
   * back over concurrent updates. `extra` is a factory rather than a plain
   * object because some callers (publish) need the ad the guard just
   * fetched to compute their update (e.g. resolving its publication plan).
   */
  private transitionTo(
    id: string,
    expectedStatus: string,
    nextStatus: AdStatus,
    extra?: (ad: AdEntity) => Partial<AdEntity>
  ): OperatorFunction<AdEntity, AdEntity> {
    return concatMap((ad: AdEntity) => {
      if (!ad) {
        return throwError(
          () => new AdNotInExpectedStateError(id, expectedStatus)
        );
      }
      const update: Partial<AdEntity> = {
        status: nextStatus,
        ...(extra ? extra(ad) : {}),
      };
      return this.adsRepository.updateOne(id, update);
    });
  }
}
