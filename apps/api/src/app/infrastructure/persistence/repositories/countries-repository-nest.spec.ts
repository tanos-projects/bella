import { CountriesRepositoryNest } from './countries-repository-nest';

describe('CountriesRepositoryNest', () => {
  let repository: CountriesRepositoryNest;
  let countryModel: any;

  beforeEach(() => {
    countryModel = {};
    countryModel.find = jest.fn();
    countryModel.findById = jest.fn();
    countryModel.findOne = jest.fn();
    repository = new CountriesRepositoryNest(countryModel);
  });

  describe('findAll', () => {
    it('spreads the given criteria straight into a Mongo find query', (done) => {
      countryModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ id: '1' }]),
      });

      repository.findAll({ iso2: 'CI' } as any).subscribe((result) => {
        expect(countryModel.find).toHaveBeenCalledWith({ iso2: 'CI' });
        expect(result).toEqual([{ id: '1' }]);
        done();
      });
    });
  });

  describe('findOne', () => {
    it('delegates to findById', (done) => {
      countryModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1' }),
      });

      repository.findOne('1').subscribe(() => {
        expect(countryModel.findById).toHaveBeenCalledWith('1');
        done();
      });
    });
  });

  describe('findByName', () => {
    it('queries Mongo by the `name` field (the Country schema does declare one)', (done) => {
      countryModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1', name: 'Ivory Coast' }),
      });

      repository.findByName('Ivory Coast').subscribe(() => {
        expect(countryModel.findOne).toHaveBeenCalledWith({
          name: 'Ivory Coast',
        });
        done();
      });
    });
  });
});
