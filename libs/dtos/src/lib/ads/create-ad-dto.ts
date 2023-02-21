import { CountryDetailedDTO } from '../countries/country-dto';
import { BaseDTO, ContactSettingDTO } from './ad-dto';

export interface CreateAdDTO extends BaseDTO {
  readonly country: CountryDetailedDTO;
  readonly city?: string;
  readonly contactSettings?: ContactSettingDTO;
}
