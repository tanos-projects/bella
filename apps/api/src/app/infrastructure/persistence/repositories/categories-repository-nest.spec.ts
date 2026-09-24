import { CategoriesRepositoryNest } from './categories-repository-nest';

describe('CategoriesRepositoryNest', () => {
  let repository: CategoriesRepositoryNest;
  let categoryModel: any;

  beforeEach(() => {
    categoryModel = {};
    categoryModel.find = jest.fn();
    repository = new CategoriesRepositoryNest(categoryModel);
  });

  describe('findAll', () => {
    it('spreads the given criteria straight into a Mongo find query', (done) => {
      categoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ id: '1' }]),
      });

      repository.findAll({ code: 'cars' } as any).subscribe((result) => {
        expect(categoryModel.find).toHaveBeenCalledWith({ code: 'cars' });
        expect(result).toEqual([{ id: '1' }]);
        done();
      });
    });

    it('queries with an empty filter when no criteria is given', (done) => {
      categoryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      });

      repository.findAll().subscribe(() => {
        expect(categoryModel.find).toHaveBeenCalledWith({});
        done();
      });
    });
  });
});
