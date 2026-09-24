import { CategoryEntity } from '@bella/api/domain';
import * as CategoryMapper from './category.mapper';

describe('CategoryMapper', () => {
  describe('modelToDTO', () => {
    it('maps id through as-is and defaults other falsy fields to null', () => {
      const model: CategoryEntity = {
        id: 'cat-1',
        code: '',
        label: '',
        description: '',
        top: true,
        selectable: true,
      };

      const dto = CategoryMapper.modelToDTO(model);

      expect(dto).toEqual({
        id: 'cat-1',
        code: null,
        label: null,
        description: null,
      });
    });

    it('does not carry the top/selectable domain-only flags into the DTO', () => {
      const model: CategoryEntity = {
        id: 'cat-1',
        code: 'cars',
        label: 'Cars',
        description: 'Vehicles',
        top: true,
        selectable: false,
      };

      const dto = CategoryMapper.modelToDTO(model) as any;

      expect(dto.top).toBeUndefined();
      expect(dto.selectable).toBeUndefined();
    });

    it('throws a TypeError rather than a domain error when the model is null', () => {
      // Unlike AdMapper/UserMapper, CategoryMapper has no null guard: this
      // will throw when it tries to read `model.id` off null. Documented as
      // current behavior, not a desired one.
      expect(() =>
        CategoryMapper.modelToDTO(null as unknown as CategoryEntity)
      ).toThrow(TypeError);
    });
  });

  describe('modelToDTOList', () => {
    it('maps every item through modelToDTO', () => {
      const models: CategoryEntity[] = [
        { id: '1', code: 'a', label: 'A', description: '', top: false, selectable: true },
        { id: '2', code: 'b', label: 'B', description: '', top: false, selectable: true },
      ];

      expect(CategoryMapper.modelToDTOList(models).map((d) => d.id)).toEqual([
        '1',
        '2',
      ]);
    });
  });
});
