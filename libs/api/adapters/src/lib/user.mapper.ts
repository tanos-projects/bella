import { UserEntity } from '@bella/api/domain';
import { CreateUserDTO, UserDTO, UserProfileDTO } from '@bella/dtos';

// None of these three functions throws on a null model/dto anymore (Phase
// 2, sub-point 5): a mapper's job is to map, not to decide the HTTP status
// for "not found"/"bad request" - that decision now belongs to the caller
// (UsersController, or AdMapper.modelToDTO for an ad's owner), which must
// check for null itself before mapping. See throwIfNullish in
// apps/api/src/app/utils.
export const modelToDTO: (model: UserEntity) => UserDTO = (model) => {
  return {
    id: model.id || null,
    username: model.username || null,
    email: model.email || null,
    lastname: model.lastname || null,
    firstname: model.firstname || null,
    mobilePhone: model.mobilePhone || null,
    birthdate: model.birthdate || null,
    country: model.country || null,
    picture: model.picture || null,
  };
};

export const modelToProfileDTO: (model: UserEntity) => UserProfileDTO = (
  model,
) => {
  const dto: UserProfileDTO = {
    id: model.id || null,
    username: model.username || null,
    country: model.country || null,
    picture: model.picture || null,
  };

  return dto;
};

export const dtoToModel: (dto: CreateUserDTO) => UserEntity = (dto) => {
  return {
    username: dto.username || null,
    email: dto.email || null,
    lastname: dto.lastname || null,
    firstname: dto.firstname || null,
    mobilePhone: dto.mobilePhone || null,
    birthdate: dto.birthdate || null,
    country: dto.country || null,
  };
};

export const modelToDTOList: (list: UserEntity[]) => UserDTO[] = (list) =>
  list.map(modelToDTO);
