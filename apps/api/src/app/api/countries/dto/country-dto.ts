export class CountryDTO {
  readonly id: string;
  readonly name: string;
  readonly iso2: string;
  readonly phoneCode: string;
  readonly flag: string;
}

export class CountryDetailedDTO extends CountryDTO {
  readonly currency: string;
}
