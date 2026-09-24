import { Inject, Injectable } from '@nestjs/common';
import {
  AdsService as AdsDomainService,
  PublicationPlanResolver,
  systemClock,
} from '@bella/api/domain';
import { AdsRepositoryNest } from '../persistence/repositories/ads-repository-nest';
import { PUBLICATION_PLAN_RESOLVER } from './ads.tokens';

@Injectable()
export class AdsService extends AdsDomainService {
  constructor(
    readonly adRepository: AdsRepositoryNest,
    @Inject(PUBLICATION_PLAN_RESOLVER) planResolver: PublicationPlanResolver
  ) {
    super(adRepository, planResolver, systemClock);
  }
}
