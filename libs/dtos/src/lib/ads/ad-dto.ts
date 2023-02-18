import { UserDTO } from '../users/user-dto';

export interface AdImageDTO {
  readonly id?: string;
  readonly miniatureUrl?: string;
  readonly url?: string;
}
export interface ContactSettingDTO {
  readonly phone?: boolean;
  readonly whatsapp?: boolean;
  readonly email?: boolean;
}

export interface BaseDTO {
  readonly category: string;
  readonly description: string;
  readonly price: number;
  readonly title: string;
  readonly quality: string;
  readonly images?: AdImageDTO[];
}

export interface AdDTO extends BaseDTO {
  readonly id: string;
  readonly country?: string;
  readonly city?: string;
  readonly currency?: string;
  readonly owner?: UserDTO;
  readonly createdAt?: string;
  readonly contactSettings?: ContactSettingDTO;
}
