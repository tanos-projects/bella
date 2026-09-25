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
  // Display identity (email, falling back to name) of the moderator who
  // last transitioned this ad via reject/archive/approve - see AuthUser.
  moderatedBy?: string;
  // Set once, only by AdsService.publish() - unlike updatedAt (rewritten on
  // every transition), this survives a later reject/archive so an audit
  // view can still show when an ad first went live. Stays empty for ads
  // that never reached PUBLISHED (e.g. rejected straight from SUBMITTED).
  publishedAt?: Date;

  // setPublished(value: boolean): void {
  //   this.published = value;
  // }

  // hey(): string {
  //   return 'Hello';
  // }
}
