import { of } from 'rxjs';
import { CategoriesController } from './categories.controller';

describe('CategoriesController', () => {
  function createController(categoryServiceOverrides: any = {}) {
    const categoryService: any = {
      findAll: jest.fn().mockReturnValue(of([])),
      findTop: jest.fn().mockReturnValue(of([])),
      ...categoryServiceOverrides,
    };
    return { controller: new CategoriesController(categoryService), categoryService };
  }

  describe('getAll', () => {
    // Characterization of a real bug: `@Query() selectable: boolean` with no
    // key name binds the WHOLE query-params object to `selectable`, not a
    // `?selectable=` value. Since any object (even `{}`, what Nest passes
    // for a request with no query string at all) is truthy, `Boolean(...)`
    // is always true - this endpoint can never actually request
    // non-selectable categories, regardless of what the caller sends.
    it('always filters selectable:true, even with no query params at all', (done) => {
      const { controller, categoryService } = createController();

      controller.getAll({} as any).subscribe(() => {
        expect(categoryService.findAll).toHaveBeenCalledWith({
          selectable: true,
        });
        done();
      });
    });

    it('still filters selectable:true even when the caller explicitly sends ?selectable=false', (done) => {
      const { controller, categoryService } = createController();

      // Simulates what Nest would actually bind for `GET /categories?selectable=false`:
      // the raw query-string value 'false' inside the query object, which
      // is itself truthy as an object.
      controller.getAll({ selectable: 'false' } as any).subscribe(() => {
        expect(categoryService.findAll).toHaveBeenCalledWith({
          selectable: true,
        });
        done();
      });
    });

    it('maps the result through CategoryMapper.modelToDTOList', (done) => {
      const { controller } = createController({
        findAll: jest.fn().mockReturnValue(
          of([{ id: '1', code: 'cars', label: 'Cars', description: '' }])
        ),
      });

      controller.getAll({} as any).subscribe((result) => {
        expect(result).toEqual([
          { id: '1', code: 'cars', label: 'Cars', description: null },
        ]);
        done();
      });
    });
  });

  describe('getTop', () => {
    it('delegates to categoryService.findTop and maps the result', (done) => {
      const { controller, categoryService } = createController({
        findTop: jest.fn().mockReturnValue(
          of([{ id: '1', code: 'top', label: 'Top', description: '' }])
        ),
      });

      controller.getTop().subscribe((result) => {
        expect(categoryService.findTop).toHaveBeenCalledWith();
        expect(result).toEqual([
          { id: '1', code: 'top', label: 'Top', description: null },
        ]);
        done();
      });
    });
  });
});
