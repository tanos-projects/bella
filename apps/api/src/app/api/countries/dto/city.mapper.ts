

import { CityEntity } from '../../../domain/cities/city.entity';
import { CityDetailedDTO, CityDTO } from './city-dto';

export const modelToDTO: (model: CityEntity) => CityDTO = (model) => ({
  id: model.id,
  countryiso2: model.countryiso2 || null,
  code: model.code || null,
  label: model.label || null,
});

export const modelDetailedToDTO: (model: CityEntity) => CityDetailedDTO = (
  model,
) => ({
  id: model.id,
  countryiso2: model.countryiso2 || null,
  stateCode: model.stateCode || null,
  state: model.state || null,
  provinceCode: model.provinceCode || null,
  province: model.province || null,
  departmentCode: model.departmentCode || null,
  department: model.department || null,
  code: model.code || null,
  label: model.label || null,
});

export const modelToDTOList: (list: CityEntity[]) => CityDTO[] = (list) =>
  list.map(modelToDTO);

export const modelDetailedToDTOList: (
  list: CityEntity[],
) => CityDetailedDTO[] = (list) => list.map(modelDetailedToDTO);
