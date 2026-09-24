import { of } from 'rxjs';
import { CategoriesRepository } from './categories.repository';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let repository: jest.Mocked<CategoriesRepository>;

  beforeEach(() => {
    repository = { findAll: jest.fn() };
    service = new CategoriesService(repository);
  });

  describe('findAll', () => {
    it('forwards a copy of the given filter to the repository', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAll({ code: 'cars' }).subscribe();

      expect(repository.findAll).toHaveBeenCalledWith({ code: 'cars' });
    });

    it('defaults to an empty filter when none is given', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAll().subscribe();

      expect(repository.findAll).toHaveBeenCalledWith({});
    });
  });

  describe('findTop', () => {
    it('always queries the repository with the pseudo-filter { top: true }, ignoring any other criteria', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findTop().subscribe();

      expect(repository.findAll).toHaveBeenCalledWith({ top: true });
    });
  });
});
