import { getCurrencySymbol } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { of } from 'rxjs';
import {
  concatMap,
  distinctUntilChanged,
  startWith,
  tap,
} from 'rxjs/operators';

import { AdDTO } from '../../../shared/models/ads.model';
import { CountryDTO } from '../../../shared/models/countries.model';
import {
  CategoriesService,
  NO_QUALITY_CATEGORIES,
} from '../../../shared/services/categories.service';
import { CountriesService } from '../../../shared/services/countries.service';
import { QualitiesService } from '../../../shared/services/qualities.service';
import { UserSettingsService } from '../../../shared/services/user-settings.service';
import { FormComponent } from '../../../shared/form/form.component';

interface AdFormModel {
  category: FormControl<string>;
  description: FormControl<string>;
  price: FormControl<number>;
  title: FormControl<string>;
  quality: FormControl<string>;
  country: FormControl<string>;
  city: FormControl<string>;
}

@Component({
  selector: 'bella-ad-form',
  templateUrl: './ad-form.component.html',
  styleUrls: ['./ad-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormComponent],
})
export class AdFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private userSettingsService = inject(UserSettingsService);
  private countriesService = inject(CountriesService);
  private categoriesService = inject(CategoriesService);
  private qualitiesService = inject(QualitiesService);

  // private _submitting = false;

  options: FormlyFormOptions = {
    formState: {
      submitting: false,
    },
  };

  @Input() set submitting(value: boolean) {
    this.options.formState.submitting = value;
  }

  @Output() submitData = new EventEmitter<AdDTO>(true);

  form = new FormGroup<AdFormModel>({} as AdFormModel);
  model: any = {
    // category: 'multimedia',
    // price: 52,
    // description: 'sfdfdfsdfsdfsdfdf',
    // title: 'Super prefilled ad',
    // country: { iso2: 'bj' },
    // city: 'Cotonou'
  };

  fields: FormlyFieldConfig[] = [];

  ngOnInit(): void {
    this.fields = [
      {
        type: 'stepper',
        props: {
          submitButton: true,
          submitButtonLabel: 'Publier',
        },
        fieldGroup: [
          {
            templateOptions: { label: 'Information générale' },
            fieldGroup: [
              {
                key: 'title',
                type: 'input',
                focus: true,
                props: {
                  label: 'Titre',
                  required: true,
                },
                // modelOptions: {
                //   debounce: {
                //     default: 1000,
                //   }
                // }
              },
              {
                key: 'category',
                type: 'select',
                hideExpression: '!model.title',
                props: {
                  label: 'Catégorie',
                  required: true,
                  options: this.categoriesService.getAll(),
                  valueProp: 'code',
                  labelProp: 'label',
                },
              },
            ],
          },
          {
            templateOptions: { label: 'Photos' },
            fieldGroup: [
              {
                key: 'images',
                type: 'picture-uploader',
                props: {
                  label: 'Photos',
                  limit: 3,
                  accept: '.jpg,.png',
                },
                // validators: {
                //   ip: {
                //     expression: (c: AbstractControl) => /(\d{1,3}\.){3}\d{1,3}/.test(c.value),
                //     message: (error: any, field: FormlyFieldConfig) => `"${field.formControl.value}" is not a valid IP Address`,
                //   },
                // },
              },
            ],
          },
          {
            templateOptions: { label: 'Informations complémentaires' },
            fieldGroup: [
              {
                key: 'quality',
                type: 'select',
                hideExpression: (model) => {
                  return NO_QUALITY_CATEGORIES.includes(model.category);
                },
                props: {
                  label: 'Qualité',
                  required: true,
                  options: this.qualitiesService.getAll(),

                  valueProp: 'code',
                  labelProp: 'label',
                },
                expressions: {
                  'templateOptions.required': (model: any) =>
                    NO_QUALITY_CATEGORIES.includes(model.category),
                },
              },
              {
                key: 'description',
                type: 'textarea',
                // hideExpression: '!model.category',
                props: {
                  label: 'Description',
                  required: true,
                  placeholder:
                    'Donne moi un peu plus de détail sur ton annonce...',
                  rows: 3,
                },
                // modelOptions: {
                //   updateOn: 'blur'
                // }
              },
            ],
          },
          {
            templateOptions: { label: 'Localisation' },
            fieldGroup: [
              {
                key: 'country',
                type: 'ng-select',
                props: {
                  label: 'Country',
                  required: true,
                  options: [],
                  compareWith: (o1: CountryDTO, o2: CountryDTO) =>
                    o1?.iso2 === o2?.iso2,
                  labelProp: 'name',

                  //ng-select
                  clearable: false,
                },
                hooks: {
                  onInit: (field) => {
                    if (field?.props) {
                      field.props.options = this.countriesService
                        .getAllDetailed()
                        .pipe(
                          tap((countries) => {
                            if (!field.formControl?.value) {
                              const defaultCountry = countries.find(
                                (c) =>
                                  c.iso2 ===
                                  this.userSettingsService.getCountry()
                              );
                              if (defaultCountry) {
                                field.formControl?.setValue(defaultCountry);
                              }
                            }
                          })
                        );
                    }
                  },
                },
              },
              {
                key: 'city',
                type: 'ng-select',
                props: {
                  label: 'Ville',
                  required: true,
                  options: [],
                  valueProp: 'label',
                  labelProp: 'label',
                  clearable: false,
                },
                expressions: {
                  'templateOptions.disabled': '!model.country',
                },
                hooks: {
                  onInit: (field) => {
                    if (field.props) {
                      const countryControl = field.form?.get('country');
                      const country = countryControl.value;
                      // console.log(country);
                      field.props.options = countryControl.valueChanges.pipe(
                        startWith(country),
                        distinctUntilChanged(),
                        concatMap((value: CountryDTO) => {
                          return value?.iso2
                            ? this.countriesService.getCitiesByCountry(
                                value.iso2
                              )
                            : of([]);
                        }),
                        tap((options) => {
                          if (
                            !options.find(
                              (city) => city.label === field.model.city
                            )
                          ) {
                            field.formControl?.reset();
                            // field.formControl?.clearValidators();
                          }
                        })
                      );
                    }
                  },
                },
              },
            ],
          },
          {
            templateOptions: { label: 'Prix et modalités de contact' },
            fieldGroup: [
              {
                key: 'price',
                type: 'input',
                props: {
                  label: 'Prix',
                  type: 'number',
                  required: true,
                  addonRight: {
                    text: '$',
                  },
                },
                // modelOptions: {
                //   updateOn: 'blur'
                // }
                hooks: {
                  onInit: (field) => {
                    if (field.props) {
                      const country: CountryDTO | undefined =
                        field?.form?.get('country')?.value;

                      field.props['addonRight'].text = getCurrencySymbol(
                        country?.currency ?? 'XOF',
                        'narrow'
                      );
                    }
                  },
                },
              },
              {
                key: 'contactSettings',
                type: 'multicheckbox',
                props: {
                  label: 'Comment te contacter pour cette annonce ?',
                  options: [
                    { value: 'phone', label: 'Phone' },
                    { value: 'whatsapp', label: 'Whatsapp' },
                    { value: 'email', label: 'Email' },
                  ],
                },
              },
            ],
          },
        ],
      },
    ];

    this.form.patchValue(this.model);
  }

  onSubmit(data: AdDTO): void {
    this.submitData.emit(data);
  }
}
