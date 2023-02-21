export class UserDTO {
  readonly id?: string;
  readonly username?: string;
  readonly picture?: string;
  readonly email?: string;
  readonly lastname?: string;
  readonly firstname?: string;
  readonly mobilePhone?: string;
  readonly birthdate?: Date;
  readonly country?: string;
}
export class UserProfileDTO {
  readonly id?: string;
  readonly username?: string;
  readonly picture?: string;
  readonly country?: string;
  readonly registerDate?: Date;
}
