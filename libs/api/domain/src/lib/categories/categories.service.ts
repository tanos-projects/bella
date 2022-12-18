import { Observable } from 'rxjs';
import { CategoriesRepository } from './categories.repository';
import { CategoryEntity } from './category.entity';

export class CategoriesService {
  constructor(protected categoriesRepository: CategoriesRepository) {}

  findAll(filter: Partial<CategoryEntity> = {}): Observable<CategoryEntity[]> {
    return this.categoriesRepository.findAll({ ...filter });
  }

  findTop(): Observable<CategoryEntity[]> {
    return this.categoriesRepository.findAll({ top: true });
  }
}
