import { Injectable } from '@nestjs/common';
import { CitiesService as CitiesDomainService } from '@bella/api/domain';
import { CitiesRepositoryNest } from '../persistence/repositories/cities-repository-nest';

@Injectable()
export class CitiesService extends CitiesDomainService {
  constructor(readonly countriesRepository: CitiesRepositoryNest) {
    super(countriesRepository);
  }
}
