import { ErrorMessage } from 'ng-bootstrap-form-validation';

export function requiredFormat(label: string | undefined, error: any): string {
  return `${label} est obligatoire`;
}

export function emailFormat(label: string | undefined, error: any): string {
  return `L'adresse mail n'est pas valide`;
}

export function phoneNumberFormat(label: string | undefined, error: any): string {
  return `Le numéro de téléphone n'est valide`;
}

export function patternFormat(label: string | undefined, error: any): string {
  console.log(error);
  return `Saisie invalide ${error}`;
}

export const CUSTOM_ERRORS: ErrorMessage[] = [
  {
    error: 'required',
    format: requiredFormat
  },
  {
    error: 'email',
    format: emailFormat
  },
  {
    error: 'phone',
    format: phoneNumberFormat
  },
  {
    error: 'pattern',
    format: patternFormat
  }
];
