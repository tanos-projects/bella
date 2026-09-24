import { CategoryMapper } from '@bella/api/adapters';
import { CategoryDTO } from '@bella/dtos';
import { Controller, Get, Query } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CategoriesService } from '../infrastructure/categories/categories.service';


@Controller('categories')
export class CategoriesController {
  constructor(private categoryService: CategoriesService) {}

  @Get()
  getAll(@Query('selectable') selectable?: string): Observable<CategoryDTO[]> {
    return this.categoryService
      .findAll({ selectable: selectable === 'true' })
      .pipe(map(CategoryMapper.modelToDTOList));
  }

  @Get('top')
  getTop(): Observable<CategoryDTO[]> {
    return this.categoryService.findTop().pipe(map(CategoryMapper.modelToDTOList));
  }
}
