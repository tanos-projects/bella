import { AdEntity } from '@bella/api/domain';
import { AdDTO, CreateAdDTO } from '@bella/dtos';
import * as UserMapper from './user.mapper';

// modelToDTO no longer throws on a null model (Phase 2, sub-point 5): a
// mapper's job is to map, not to decide the HTTP status for "not found" -
// that decision now belongs to the caller (AdsController), which must
// check for null itself before mapping. See throwIfNullish in
// apps/api/src/app/utils.
export const modelToDTO: (model: AdEntity) => AdDTO = (model) => {
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
    // Not UserMapper.modelToDTO(model.owner) unconditionally: a null/
    // undefined owner (e.g. a dangling reference) now degrades to a null
    // owner in the DTO, like every other optional field on this mapper,
    // instead of cascading into UserMapper's own null handling.
    owner: model.owner ? UserMapper.modelToDTO(model.owner) : null,
    status: model.status || null,
    approbationMessage: model.approbationMessage || null,
    moderatedBy: model.moderatedBy || null,
    publishedAt: model.publishedAt || null,
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
