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
    // Fixed bug (Phase 2, sub-point 9): `@Query() selectable: boolean` with
    // no key name used to bind the WHOLE query-params object to
    // `selectable`, not a `?selectable=` value - any object (even `{}`) is
    // truthy, so the filter was always `{selectable: true}` regardless of
    // what the caller sent. `@Query('selectable')` now extracts the actual
    // string value and it is compared explicitly to `'true'`.
    it('filters selectable:false when no query param is sent at all', (done) => {
      const { controller, categoryService } = createController();

      controller.getAll(undefined).subscribe(() => {
        expect(categoryService.findAll).toHaveBeenCalledWith({
          selectable: false,
        });
        done();
      });
    });

    it('filters selectable:false when the caller explicitly sends ?selectable=false', (done) => {
      const { controller, categoryService } = createController();

      controller.getAll('false').subscribe(() => {
        expect(categoryService.findAll).toHaveBeenCalledWith({
          selectable: false,
        });
        done();
      });
    });

    it('filters selectable:true when the caller sends ?selectable=true', (done) => {
      const { controller, categoryService } = createController();

      controller.getAll('true').subscribe(() => {
        expect(categoryService.findAll).toHaveBeenCalledWith({
          selectable: true,
        });
        done();
      });
    });

    it('?selectable=false and ?selectable=true produce different filters (proves the bug is fixed)', (done) => {
      const { controller, categoryService } = createController();

      controller.getAll('false').subscribe(() => {
        controller.getAll('true').subscribe(() => {
          expect(categoryService.findAll).toHaveBeenNthCalledWith(1, {
            selectable: false,
          });
          expect(categoryService.findAll).toHaveBeenNthCalledWith(2, {
            selectable: true,
          });
          done();
        });
      });
    });

    it('maps the result through CategoryMapper.modelToDTOList', (done) => {
      const { controller } = createController({
        findAll: jest.fn().mockReturnValue(
          of([{ id: '1', code: 'cars', label: 'Cars', description: '' }])
        ),
      });

      controller.getAll(undefined).subscribe((result) => {
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
