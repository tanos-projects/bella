import { of } from 'rxjs';
import { CountriesRepository } from './countries.repository';
import { CountriesService } from './countries.service';

describe('CountriesService', () => {
  let service: CountriesService;
  let repository: jest.Mocked<CountriesRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByName: jest.fn(),
    };
    service = new CountriesService(repository);
  });

  describe('findOne', () => {
    it('delegates to the repository by id', () => {
      repository.findOne.mockReturnValue(of(undefined));

      service.findOne('country-1').subscribe();

      expect(repository.findOne).toHaveBeenCalledWith('country-1');
    });
  });

  describe('findByName', () => {
    it('delegates to the repository by name', () => {
      repository.findByName.mockReturnValue(of(undefined));

      service.findByName('Ivory Coast').subscribe();

      expect(repository.findByName).toHaveBeenCalledWith('Ivory Coast');
    });
  });

  describe('findAll', () => {
    it('delegates to the repository with no criteria', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findAll().subscribe();

      expect(repository.findAll).toHaveBeenCalledWith();
    });
  });
});
