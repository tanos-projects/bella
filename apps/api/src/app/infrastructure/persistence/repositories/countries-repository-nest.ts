import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';
import {
  CountrySearchCriteria,
  CountriesRepository,
} from '../../../domain/countries/countries.repository';
import { CountryEntity } from '../../../domain/countries/country.entity';
import { Country, CountryDocument } from '../schemas/country.schema';

@Injectable()
export class CountriesRepositoryNest implements CountriesRepository {
  constructor(
    @InjectModel(Country.name) private countryModel: Model<CountryDocument>,
  ) {}

  findAll(criteria?: CountrySearchCriteria): Observable<CountryEntity[]> {
    return from(this.countryModel.find({ ...criteria }).exec());
  }

  findOne(id: string): Observable<CountryEntity> {
    return from(this.countryModel.findById(id).exec());
  }

  findByName(name: string): Observable<CountryEntity> {
    return from(this.countryModel.findOne({ name }).exec());
  }
}
