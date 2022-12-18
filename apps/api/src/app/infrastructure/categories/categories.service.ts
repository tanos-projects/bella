import { Injectable } from '@nestjs/common';
import { CategoriesService as CategoriesDomainService } from '@bella/api/domain';
import { CategoriesRepositoryNest } from '../persistence/repositories/categories-repository-nest';

@Injectable()
export class CategoriesService extends CategoriesDomainService {
  constructor(readonly categoriesRepository: CategoriesRepositoryNest) {
    super(categoriesRepository);
  }
}
