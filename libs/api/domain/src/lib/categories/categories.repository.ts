import { Observable } from 'rxjs';
import { CategoryEntity } from './category.entity';

export type CategorySearchCriteria = Partial<CategoryEntity>;
export interface CategoriesRepository {
  findAll(criteria?: CategorySearchCriteria): Observable<CategoryEntity[]>;
}
