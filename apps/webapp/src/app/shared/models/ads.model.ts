import { AuthUser } from '../../auth/auth-user.model';
import { CountryDTO } from './countries.model';
import { ContactSetting } from './contact.model';

// TODO find a way to factorize DTO
export interface AdImageDTO {
  id?: string;
  miniatureUrl?: string;
  url?: string;
}

export interface BaseAdDTO {
  category: string;
  description: string;
  price: number;
  title: string;
  quality: string;
}
export interface CreateAdDTO extends BaseAdDTO {
  country?: CountryDTO;
}

export interface AdDTO extends BaseAdDTO {
  id: string;
  // coverImage?: string;
  images?: AdImageDTO[];
  country?: string;
  city?: string;
  currency?: string;
  owner?: AuthUser;
  createdAt?: Date;
  updatedAt?: Date;
  contactType?: string;
  contactSettings?: ContactSetting;
}
