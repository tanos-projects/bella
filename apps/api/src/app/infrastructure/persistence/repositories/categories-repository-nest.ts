import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { from, Observable } from 'rxjs';
import { CategoryEntity } from '@bella/api/domain';
import {
  CategoriesRepository,
  CategorySearchCriteria,
} from '@bella/api/domain';
import { Category, CategoryDocument } from '../schemas/category.schema';

@Injectable()
export class CategoriesRepositoryNest implements CategoriesRepository {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  findAll(criteria?: CategorySearchCriteria): Observable<CategoryEntity[]> {
    return from(this.categoryModel.find({ ...criteria }).exec());
  }
}
