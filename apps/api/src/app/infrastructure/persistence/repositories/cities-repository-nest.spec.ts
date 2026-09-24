import { CitiesRepositoryNest } from './cities-repository-nest';

describe('CitiesRepositoryNest', () => {
  let repository: CitiesRepositoryNest;
  let cityModel: any;

  beforeEach(() => {
    cityModel = {};
    cityModel.find = jest.fn();
    cityModel.findById = jest.fn();
    cityModel.findOne = jest.fn();
    repository = new CitiesRepositoryNest(cityModel);
  });

  describe('findAll', () => {
    it('spreads the given criteria and always sorts by label ascending', (done) => {
      const sort = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ id: '1' }]),
      });
      cityModel.find.mockReturnValue({ sort });

      repository.findAll({ countryiso2: 'CI' } as any).subscribe((result) => {
        expect(cityModel.find).toHaveBeenCalledWith({ countryiso2: 'CI' });
        expect(sort).toHaveBeenCalledWith({ label: 1 });
        expect(result).toEqual([{ id: '1' }]);
        done();
      });
    });
  });

  describe('findOne', () => {
    it('delegates to findById', (done) => {
      cityModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ id: '1' }),
      });

      repository.findOne('1').subscribe(() => {
        expect(cityModel.findById).toHaveBeenCalledWith('1');
        done();
      });
    });
  });

  describe('findByName', () => {
    // Characterization of what looks like a real bug: the City schema
    // (apps/api/.../schemas/city.schema.ts) has no `name` field, only
    // `label` - so this query is filtering on a field that never exists on
    // a stored document. It is documented here exactly as it behaves today
    // (queries `{ name }` regardless), not "fixed" to query on `label`.
    it('queries Mongo by a `name` field the City schema does not declare', (done) => {
      cityModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      repository.findByName('Abidjan').subscribe((result) => {
        expect(cityModel.findOne).toHaveBeenCalledWith({ name: 'Abidjan' });
        expect(result).toBeNull();
        done();
      });
    });
  });
});
