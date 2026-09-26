import { ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { AdEntity } from '@bella/api/domain';

import { AuthUser } from '../auth/auth-user';
import { AdsService } from '../infrastructure/ads/ads.service';
import { UsersService } from '../infrastructure/users/users.service';

/**
 * Extracted from `AdsController.publishAd` (Phase 2, sub-point 3b). Only
 * the ad's owner, or a caller with the `manage:publications` permission
 * (see issue #49), may publish it - a policy a declarative guard alone
 * cannot express, since it needs the loaded resource to compare the caller
 * against its owner, not just a claim on the token. A JwtAuthGuard-style
 * guard has no access to the ad being acted on.
 *
 * Pure move: reproduces the controller's prior inline logic exactly,
 * locked in beforehand by the `AdsController.publishAd` characterization
 * tests in `ads.controller.spec.ts` (written before this extraction, per
 * the chantier's non-negotiable rule for a behavior-preserving move of a
 * non-trivial policy).
 */
export class PublishAuthorizationPolicy {
  constructor(
    private adsService: AdsService,
    private usersService: UsersService
  ) {}

  publishIfAuthorized(id: string, user: AuthUser): Observable<AdEntity> {
    if ((user.permissions ?? []).includes('manage:publications')) {
      return this.adsService.publish(id);
    }
    return this.getUser(user).pipe(
      switchMap((caller) =>
        this.adsService.findOne(id).pipe(
          switchMap((ad) => {
            if (!ad.owner || ad.owner.id !== caller.id) {
              throw new ForbiddenException('Only the ad owner can publish it');
            }
            return this.adsService.publish(id);
          })
        )
      )
    );
  }

  private getUser(user: AuthUser) {
    return this.usersService.findOneByIdpId(user.sub);
  }
}
