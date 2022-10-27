import { Injectable } from '@nestjs/common';
import { CountriesService as CountriesDomainService } from '../../domain/countries/countries.service';
import { CountriesRepositoryNest } from '../persistence/repositories/countries-repository-nest';

@Injectable()
export class CountriesService extends CountriesDomainService {
  constructor(readonly countriesRepository: CountriesRepositoryNest) {
    super(countriesRepository);
  }
}
