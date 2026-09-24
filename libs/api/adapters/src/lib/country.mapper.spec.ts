import { CountryEntity } from '@bella/api/domain';
import * as CountryMapper from './country.mapper';

describe('CountryMapper', () => {
  const model: CountryEntity = {
    id: 'country-1',
    name: 'Cote d\'Ivoire',
    iso2: 'CI',
    phoneCode: '+225',
    currency: 'XOF',
    flag: 'ci.png',
  };

  describe('modelToDTO', () => {
    it('maps the basic fields, dropping currency', () => {
      const dto = CountryMapper.modelToDTO(model) as any;

      expect(dto).toEqual({
        id: 'country-1',
        name: "Cote d'Ivoire",
        iso2: 'CI',
        phoneCode: '+225',
        flag: 'ci.png',
      });
      expect(dto.currency).toBeUndefined();
    });
  });

  describe('modelDetailedToDTO', () => {
    it('maps every field including currency', () => {
      const dto = CountryMapper.modelDetailedToDTO(model);

      expect(dto).toEqual({
        id: 'country-1',
        name: "Cote d'Ivoire",
        iso2: 'CI',
        phoneCode: '+225',
        currency: 'XOF',
        flag: 'ci.png',
      });
    });
  });

  it('defaults falsy fields to null, keeping id as-is', () => {
    const dto = CountryMapper.modelToDTO({
      id: '',
      name: '',
      iso2: '',
      phoneCode: '',
      currency: '',
      flag: '',
    });

    expect(dto).toEqual({
      id: '',
      name: null,
      iso2: null,
      phoneCode: null,
      flag: null,
    });
  });

  describe('modelToDTOList / modelDetailedToDTOList', () => {
    it('map every item through their singular counterpart', () => {
      const models = [model, { ...model, id: 'country-2', iso2: 'SN' }];

      expect(CountryMapper.modelToDTOList(models).map((d) => d.iso2)).toEqual([
        'CI',
        'SN',
      ]);
      expect(
        CountryMapper.modelDetailedToDTOList(models).map((d) => d.currency)
      ).toEqual(['XOF', 'XOF']);
    });
  });
});
