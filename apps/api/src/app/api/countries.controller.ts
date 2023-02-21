import { CountryMapper, CityMapper } from '@bella/api/adapters';
import { CityDTO, CountryDetailedDTO, CountryDTO } from '@bella/dtos';
import { Controller, Get, Param } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CitiesService } from '../infrastructure/cities/cities.service';
import { CountriesService } from '../infrastructure/countries/countries.service';


@Controller('countries')
export class CountriesController {
  constructor(
    private countriesService: CountriesService,
    private citiesService: CitiesService,
  ) {}
  @Get()
  getAll(): Observable<CountryDTO[]> {
    return this.countriesService.findAll().pipe(map(CountryMapper.modelToDTOList));
  }

  @Get(':iso2/cities')
  getCities(@Param('iso2') iso2: string): Observable<CityDTO[]> {
    return this.citiesService
      .findByCountryIso2(iso2)
      .pipe(map(CityMapper.modelToDTOList));
  }

  @Get('detailed')
  getAllComplete(): Observable<CountryDetailedDTO[]> {
    return this.countriesService.findAll().pipe(map(CountryMapper.modelDetailedToDTOList));
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<CountryDTO> {
    return this.countriesService.findOne(id).pipe(map(CountryMapper.modelToDTO));
  }
}
