import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CategoryEntity } from '../../domain/categories/category.entity';
import { CategoriesService } from '../../infrastructure/categories/categories.service';
import { CategoryDTO } from './dto/category-dto';

export const modelToDTO: (model: CategoryEntity) => CategoryDTO = (model) => ({
  id: model.id,
  code: model.code || null,
  label: model.label || null,
  description: model.description || null,
});

export const modelToDTOList: (list: CategoryEntity[]) => CategoryDTO[] = (
  list,
) => list.map(modelToDTO);

@Controller('categories')
export class CategoriesController {
  constructor(private categoryService: CategoriesService) {}

  @Get()
  getAll(@Query() selectable: boolean): Observable<CategoryDTO[]> {
    return this.categoryService
      .findAll({ selectable: Boolean(selectable) })
      .pipe(map(modelToDTOList));
  }

  @Get('top')
  getTop(): Observable<CategoryDTO[]> {
    return this.categoryService.findTop().pipe(map(modelToDTOList));
  }
}
