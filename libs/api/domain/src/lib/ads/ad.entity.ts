import { UserEntity } from '../users/user.entity';

export class AdImage {
  id?: string;
  miniatureUrl?: string;
  url?: string;
}
export class ContactSetting {
  phone?: boolean;
  whatsapp?: boolean;
  email?: boolean;
}

export enum AdStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export class AdEntity {
  category: string;
  country?: string;
  city?: string;
  currency?: string;
  description: string;
  id?: string;
  images?: AdImage[];
  price: number;
  title: string;
  quality: string;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
  owner?: UserEntity;
  contactSettings?: ContactSetting;
  approbationMessage?: string;

  // setPublished(value: boolean): void {
  //   this.published = value;
  // }

  // hey(): string {
  //   return 'Hello';
  // }
}
