import { of } from 'rxjs';
import { CountriesController } from './countries.controller';

describe('CountriesController', () => {
  function createController(
    countriesServiceOverrides: any = {},
    citiesServiceOverrides: any = {}
  ) {
    const countriesService: any = {
      findAll: jest.fn().mockReturnValue(of([])),
      findOne: jest.fn().mockReturnValue(of(undefined)),
      ...countriesServiceOverrides,
    };
    const citiesService: any = {
      findByCountryIso2: jest.fn().mockReturnValue(of([])),
      ...citiesServiceOverrides,
    };
    return {
      controller: new CountriesController(countriesService, citiesService),
      countriesService,
      citiesService,
    };
  }

  const country = {
    id: '1',
    name: 'Ivory Coast',
    iso2: 'CI',
    phoneCode: '+225',
    currency: 'XOF',
    flag: 'ci.png',
  };

  describe('getAll', () => {
    it('delegates to countriesService.findAll and maps through the basic (non-detailed) mapper', (done) => {
      const { controller } = createController({
        findAll: jest.fn().mockReturnValue(of([country])),
      });

      controller.getAll().subscribe((result: any) => {
        expect(result).toEqual([
          {
            id: '1',
            name: 'Ivory Coast',
            iso2: 'CI',
            phoneCode: '+225',
            flag: 'ci.png',
          },
        ]);
        expect(result[0].currency).toBeUndefined();
        done();
      });
    });
  });

  describe('getCities', () => {
    it('delegates to citiesService.findByCountryIso2 with the :iso2 route param', (done) => {
      const { controller, citiesService } = createController(
        {},
        {
          findByCountryIso2: jest.fn().mockReturnValue(
            of([{ id: 'c1', countryiso2: 'CI', code: 'ABJ', label: 'Abidjan' }])
          ),
        }
      );

      controller.getCities('CI').subscribe((result) => {
        expect(citiesService.findByCountryIso2).toHaveBeenCalledWith('CI');
        expect(result).toEqual([
          { id: 'c1', countryiso2: 'CI', code: 'ABJ', label: 'Abidjan' },
        ]);
        done();
      });
    });
  });

  describe('getAllComplete', () => {
    it('delegates to countriesService.findAll and maps through the detailed mapper', (done) => {
      const { controller } = createController({
        findAll: jest.fn().mockReturnValue(of([country])),
      });

      controller.getAllComplete().subscribe((result) => {
        expect(result).toEqual([country]);
        done();
      });
    });
  });

  describe('findOne', () => {
    it('delegates to countriesService.findOne with the :id route param', (done) => {
      const { controller, countriesService } = createController({
        findOne: jest.fn().mockReturnValue(of(country)),
      });

      controller.findOne('1').subscribe((result: any) => {
        expect(countriesService.findOne).toHaveBeenCalledWith('1');
        expect(result.iso2).toBe('CI');
        expect(result.currency).toBeUndefined();
        done();
      });
    });
  });
});
