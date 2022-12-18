import { Injectable } from '@nestjs/common';
import { AdsService as AdsDomainService } from '@bella/api/domain';
import { AdsRepositoryNest } from '../persistence/repositories/ads-repository-nest';

@Injectable()
export class AdsService extends AdsDomainService {
  constructor(readonly adRepository: AdsRepositoryNest) {
    super(adRepository);
  }
}
