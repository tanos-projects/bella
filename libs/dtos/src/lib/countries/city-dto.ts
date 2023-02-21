export interface CityDTO {
  readonly countryiso2: string;
  readonly code: string;
  readonly label: string;
}

export interface CityDetailedDTO extends CityDTO {
  readonly stateCode: string;
  readonly state: string;
  readonly provinceCode: string;
  readonly province: string;
  readonly departmentCode: string;
  readonly department: string;
}
