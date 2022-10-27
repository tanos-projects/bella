import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoriesRepositoryNest } from '../persistence/repositories/categories-repository-nest';
import {
  Category,
  CategorySchema,
} from '../persistence/schemas/category.schema';
import { CategoriesService } from './categories.service';
// import { CategoriesService as DomainCategoriesService } from '../../domain/categories/categories.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  providers: [
    // { provide: DomainCategoriesService, useClass: CategoriesService },
    CategoriesService,
    CategoriesRepositoryNest,
  ],
  exports: [CategoriesService],
})
export class CategoriesModule {}
