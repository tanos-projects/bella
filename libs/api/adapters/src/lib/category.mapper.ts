import { CategoryEntity } from "@bella/api/domain";
import { CategoryDTO } from "@bella/dtos";

export const modelToDTO: (model: CategoryEntity) => CategoryDTO = (model) => ({
  id: model.id,
  code: model.code || null,
  label: model.label || null,
  description: model.description || null,
});

export const modelToDTOList: (list: CategoryEntity[]) => CategoryDTO[] = (
  list,
) => list.map(modelToDTO);
