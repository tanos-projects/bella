export type ValidationMessageFormatter = (error: any, label?: string) => string;

/**
 * Single source of truth for validation-error copy, consumed by both the
 * formly-driven forms (via FormlyModule.forRoot's validationMessages, using
 * field.props.label) and plain Reactive Forms (via FieldErrorComponent,
 * using an explicit [label] input) so the wording stays identical either way.
 */
export const VALIDATION_MESSAGE_FORMATTERS: Record<string, ValidationMessageFormatter> = {
  required: (_error, label) => `${label ?? 'Ce champ'} est obligatoire`,
  email: () => `L'adresse mail n'est pas valide`,
  phone: () => `Le numéro de téléphone n'est valide`,
  pattern: (error) => `Saisie invalide ${error}`
};
