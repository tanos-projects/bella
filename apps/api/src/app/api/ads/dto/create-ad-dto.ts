import { CountryDetailedDTO } from '../../countries/dto/country-dto';
import { BaseDTO, ContactSettingDTO } from './ad-dto';

export class CreateAdDTO extends BaseDTO {
  readonly country: CountryDetailedDTO;
  readonly city?: string;
  readonly contactSettings?: ContactSettingDTO;
}
