import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';
import {
  CitySearchCriteria,
  CitiesRepository,
} from '../../../domain/cities/cities.repository';
import { CityEntity } from '../../../domain/cities/city.entity';
import { City, CityDocument } from '../schemas/city.schema';

@Injectable()
export class CitiesRepositoryNest implements CitiesRepository {
  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
  ) {}

  findAll(criteria?: CitySearchCriteria): Observable<CityEntity[]> {
    return from(this.cityModel.find({ ...criteria }).sort({ label: 1 }).exec());
  }

  findOne(id: string): Observable<CityEntity> {
    return from(this.cityModel.findById(id).exec());
  }

  findByName(name: string): Observable<CityEntity> {
    return from(this.cityModel.findOne({ name }).exec());
  }
}
