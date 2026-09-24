import { of } from 'rxjs';
import { CitiesRepository } from './cities.repository';
import { CitiesService } from './cities.service';

describe('CitiesService', () => {
  let service: CitiesService;
  let repository: jest.Mocked<CitiesRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByName: jest.fn(),
    };
    service = new CitiesService(repository);
  });

  describe('findOne', () => {
    it('delegates to the repository by id', () => {
      repository.findOne.mockReturnValue(of(undefined));

      service.findOne('city-1').subscribe();

      expect(repository.findOne).toHaveBeenCalledWith('city-1');
    });
  });

  describe('findByName', () => {
    it('delegates to the repository by name', () => {
      repository.findByName.mockReturnValue(of(undefined));

      service.findByName('Abidjan').subscribe();

      expect(repository.findByName).toHaveBeenCalledWith('Abidjan');
    });
  });

  describe('findByCountryIso2', () => {
    it('translates the iso2 code into a findAll criteria object', () => {
      repository.findAll.mockReturnValue(of([]));

      service.findByCountryIso2('CI').subscribe();

      expect(repository.findAll).toHaveBeenCalledWith({ countryiso2: 'CI' });
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
