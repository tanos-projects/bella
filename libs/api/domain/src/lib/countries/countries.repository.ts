import { Observable } from 'rxjs';
import { CountryEntity } from './country.entity';

export type CountrySearchCriteria = CountryEntity;

export interface CountriesRepository {
  findAll(criteria?: CountrySearchCriteria): Observable<CountryEntity[]>;
  findOne(id: string): Observable<CountryEntity>;
  findByName(name: string): Observable<CountryEntity>;
}
