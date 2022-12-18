import { Controller, Get, Param } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CountriesService } from '../../infrastructure/countries/countries.service';
import { CountryEntity } from '@bella/api/domain';
import { CountryDetailedDTO, CountryDTO } from './dto/country-dto';
import { CitiesService } from '../../infrastructure/cities/cities.service';

import * as CityMapper from './dto/city.mapper';
import { CityDTO } from './dto/city-dto';

export const modelToDTO: (model: CountryEntity) => CountryDTO = (model) => ({
  id: model.id,
  name: model.name || null,
  iso2: model.iso2 || null,
  phoneCode: model.phoneCode || null,
  flag: model.flag || null,
});

export const modelDetailedToDTO: (
  model: CountryEntity,
) => CountryDetailedDTO = (model) => ({
  id: model.id,
  name: model.name || null,
  iso2: model.iso2 || null,
  phoneCode: model.phoneCode || null,
  currency: model.currency || null,
  flag: model.flag || null,
});

export const modelToDTOList: (list: CountryEntity[]) => CountryDTO[] = (list) =>
  list.map(modelToDTO);

export const modelDetailedToDTOList: (
  list: CountryEntity[],
) => CountryDetailedDTO[] = (list) => list.map(modelDetailedToDTO);

@Controller('countries')
export class CountriesController {
  constructor(
    private countriesService: CountriesService,
    private citiesService: CitiesService,
  ) {}
  @Get()
  getAll(): Observable<CountryDTO[]> {
    return this.countriesService.findAll().pipe(map(modelToDTOList));
  }

  @Get(':iso2/cities')
  getCities(@Param('iso2') iso2: string): Observable<CityDTO[]> {
    return this.citiesService
      .findByCountryIso2(iso2)
      .pipe(map(CityMapper.modelToDTOList));
  }

  @Get('detailed')
  getAllComplete(): Observable<CountryDetailedDTO[]> {
    return this.countriesService.findAll().pipe(map(modelDetailedToDTOList));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<CountryDTO> {
    return this.countriesService.findOne(id).pipe(map(modelToDTO));
  }
}
