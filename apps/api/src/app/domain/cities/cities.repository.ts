import { Observable } from 'rxjs';
import { CityEntity } from './city.entity';

export type CitySearchCriteria = Partial<CityEntity>;

export interface CitiesRepository {
  findAll(criteria?: CitySearchCriteria): Observable<CityEntity[]>;
  findOne(id: string): Observable<CityEntity>;
  findByName(name: string): Observable<CityEntity>;
}
