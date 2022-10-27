import { Observable } from 'rxjs';
import { CityEntity } from './city.entity';
import { CitiesRepository } from './cities.repository';

// TODO Create interface / abstract Repository to factories code
export class CitiesService {
  constructor(protected citiesRepository: CitiesRepository) {}
  findOne(id: string): Observable<CityEntity> {
    return this.citiesRepository.findOne(id);
  }

  findByName(name: string): Observable<CityEntity> {
    return this.citiesRepository.findByName(name);
  }

  findByCountryIso2(countryiso2: string): Observable<CityEntity[]> {
    return this.citiesRepository.findAll({ countryiso2 });
  }

  findAll(): Observable<CityEntity[]> {
    return this.citiesRepository.findAll();
  }
}
