import { CountryEntity } from "@bella/api/domain";
import { CountryDTO, CountryDetailedDTO } from "@bella/dtos";

export const modelToDTO: (model: CountryEntity) => CountryDTO = (model) => ({
  id: model.id,
  name: model.name || null,
  iso2: model.iso2 || null,
  phoneCode: model.phoneCode || null,
  flag: model.flag || null,
});

export const modelDetailedToDTO: (
  model: CountryEntity,
) => CountryDetailedDTO = (model) => ({
  id: model.id,
  name: model.name || null,
  iso2: model.iso2 || null,
  phoneCode: model.phoneCode || null,
  currency: model.currency || null,
  flag: model.flag || null,
});

export const modelToDTOList: (list: CountryEntity[]) => CountryDTO[] = (list) =>
  list.map(modelToDTO);

export const modelDetailedToDTOList: (
  list: CountryEntity[],
) => CountryDetailedDTO[] = (list) => list.map(modelDetailedToDTO);
