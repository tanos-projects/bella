import { AdEntity } from '@bella/api/domain';
import { AdDTO, CreateAdDTO } from '@bella/dtos';
import { NotFoundException } from '@nestjs/common';
import * as UserMapper from './user.mapper';

export const modelToDTO: (model: AdEntity) => AdDTO = (model) => {
  if (null === model) {
    throw new NotFoundException('Ad not found');
  }
  return {
    id: model.id || null,
    title: model.title || null,
    description: model.description || null,
    price: model.price || null,
    quality: model.quality || null,
    category: model.category || null,
    country: model.country || null,
    city: model.city || null,
    currency: model.currency || null,
    images: model.images
      ? model.images.map((image) => ({
          ...image,
        }))
      : [],
    contactSettings: model.contactSettings || null,
    createdAt: model.createdAt || null,
    updatedAt: model.updatedAt || null,
    owner: UserMapper.modelToDTO(model.owner),
  };
};

export const createDTOToModel: (model: CreateAdDTO) => AdEntity = (model) => ({
  title: model.title || null,
  description: model.description || null,
  price: model.price || null,
  quality: model.quality || null,
  category: model.category || null,
  country: model.country.iso2 || null,
  city: model.city || null,
  currency: model.country.currency || null,
  images: model.images || [],
  status: null,
  contactSettings: model.contactSettings || null,
});

export const modelToDTOList: (list: AdEntity[]) => AdDTO[] = (list) =>
  list.map(modelToDTO);
