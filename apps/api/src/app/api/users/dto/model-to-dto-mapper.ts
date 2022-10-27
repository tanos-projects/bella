import { UserEntity } from '../../../domain/users/user.entity';
import { UserDTO, UserProfileDTO } from './user-dto';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateUserDTO } from './create-user-dto';

export const modelToDTO: (model: UserEntity) => UserDTO = (model) => {
  if (null === model) {
    throw new NotFoundException('User not found');
  }

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
  if (null === model) {
    throw new NotFoundException('User not found');
  }

  const dto: UserProfileDTO = {
    id: model.id || null,
    username: model.username || null,
    country: model.country || null,
    picture: model.picture || null,
  };

  return dto;
};

export const dtoToModel: (dto: CreateUserDTO) => UserEntity = (dto) => {
  if (null === dto) {
    throw new BadRequestException('User not found');
  }

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
