import { CityEntity } from '@bella/api/domain';
import * as CityMapper from './city.mapper';

describe('CityMapper', () => {
  const model: CityEntity = {
    id: 'city-1',
    countryiso2: 'CI',
    stateCode: 'ST',
    state: 'Some state',
    provinceCode: 'PR',
    province: 'Some province',
    departmentCode: 'DP',
    department: 'Some department',
    code: 'ABJ',
    label: 'Abidjan',
  };

  describe('modelToDTO', () => {
    it('maps only the basic fields, dropping state/province/department', () => {
      const dto = CityMapper.modelToDTO(model) as any;

      expect(dto).toEqual({
        id: 'city-1',
        countryiso2: 'CI',
        code: 'ABJ',
        label: 'Abidjan',
      });
      expect(dto.state).toBeUndefined();
      expect(dto.province).toBeUndefined();
      expect(dto.department).toBeUndefined();
    });

    it('defaults falsy fields to null, keeping id as-is', () => {
      const dto = CityMapper.modelToDTO({
        id: '',
        countryiso2: '',
        stateCode: '',
        state: '',
        provinceCode: '',
        province: '',
        departmentCode: '',
        department: '',
        code: '',
        label: '',
      });

      expect(dto).toEqual({
        id: '',
        countryiso2: null,
        code: null,
        label: null,
      });
    });
  });

  describe('modelDetailedToDTO', () => {
    it('maps every administrative-subdivision field', () => {
      const dto = CityMapper.modelDetailedToDTO(model);

      expect(dto).toEqual({
        id: 'city-1',
        countryiso2: 'CI',
        stateCode: 'ST',
        state: 'Some state',
        provinceCode: 'PR',
        province: 'Some province',
        departmentCode: 'DP',
        department: 'Some department',
        code: 'ABJ',
        label: 'Abidjan',
      });
    });
  });

  describe('modelToDTOList / modelDetailedToDTOList', () => {
    it('map every item through their singular counterpart', () => {
      const models = [model, { ...model, id: 'city-2', label: 'Bouake' }];

      expect(
        CityMapper.modelToDTOList(models).map((d) => (d as any).id)
      ).toEqual(['city-1', 'city-2']);
      expect(
        CityMapper.modelDetailedToDTOList(models).map((d) => d.label)
      ).toEqual(['Abidjan', 'Bouake']);
    });
  });
});
