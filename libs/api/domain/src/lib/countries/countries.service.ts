import { Observable } from 'rxjs';
import { CountryEntity } from './country.entity';
import { CountriesRepository } from './countries.repository';

export class CountriesService {
  constructor(protected countriesRepository: CountriesRepository) {}
  findOne(id: string): Observable<CountryEntity> {
    return this.countriesRepository.findOne(id);
  }

  findByName(name: string): Observable<CountryEntity> {
    return this.countriesRepository.findByName(name);
  }

  findAll(): Observable<CountryEntity[]> {
    return this.countriesRepository.findAll();
  }
}
