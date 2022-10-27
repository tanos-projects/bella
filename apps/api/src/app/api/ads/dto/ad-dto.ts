import { UserDTO } from '../../users/dto/user-dto';

export class AdImageDTO {
  readonly id?: string;
  readonly miniatureUrl?: string;
  readonly url?: string;
}
export interface ContactSettingDTO {
  readonly phone?: boolean;
  readonly whatsapp?: boolean;
  readonly email?: boolean;
}

export class BaseDTO {
  readonly category: string;
  readonly description: string;
  readonly price: number;
  readonly title: string;
  readonly quality: string;
  readonly images?: AdImageDTO[];
}

export class AdDTO extends BaseDTO {
  readonly id: string;
  readonly country?: string;
  readonly city?: string;
  readonly currency?: string;
  readonly owner?: UserDTO;
  readonly contactSettings?: ContactSettingDTO;
}
