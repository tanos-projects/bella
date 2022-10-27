import { Injectable } from '@nestjs/common';
import { AdsService as AdsDomainService } from '../../domain/ads/ads.service';
import { AdsRepositoryNest } from '../persistence/repositories/ads-repository-nest';

@Injectable()
export class AdsService extends AdsDomainService {
  constructor(readonly adRepository: AdsRepositoryNest) {
    super(adRepository);
  }
}
