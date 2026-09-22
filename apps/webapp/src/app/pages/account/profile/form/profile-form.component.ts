import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  UntypedFormBuilder,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import dayjs from 'dayjs';

import { AuthUser } from '../../../../auth/auth-user.model';
import { CountriesService } from '../../../../shared/services/countries.service';
import { MyDeviceService } from '../../../../shared/services/my-device.service';

@Component({
  selector: 'bella-profile-form',
  templateUrl: './profile-form.component.html',
  standalone: false,
})
export class ProfileFormComponent implements OnInit {
  @Input() user!: AuthUser | null;
  @Input() readonlyMode = false;
  @Input() cancelable = true;

  @Output() userChange = new EventEmitter<AuthUser>(true);
  form!: UntypedFormGroup;
  countries$ = this.countriesService.getAll();

  isMobileMode = this.deviceService.isMobile();

  constructor(
    private fb: UntypedFormBuilder,
    private deviceService: MyDeviceService,
    private countriesService: CountriesService
  ) {
    this.form = this.fb.group({
      username: this.fb.control(null, {
        validators: Validators.required,
        updateOn: 'blur',
      }),
      email: this.fb.control(null, {
        validators: [Validators.required, Validators.email],
        updateOn: 'blur',
      }),
      lastname: this.fb.control(null, { updateOn: 'blur' }),
      firstname: this.fb.control(null, { updateOn: 'blur' }),
      mobilePhone: this.fb.control(null, {
        // TODO Add asyn validation depending on indicator
        validators: [
          Validators.required /*, Validators.pattern(/[+]\d{2}[(]\d{2}[)]\d{4}[-]\d{4}/)*/,
        ],
        updateOn: 'blur',
      }),
      // mobilePhoneIndicator: [null, Validators.required],
      birthdate: [null],
      country: this.fb.control(null, { validators: Validators.required }),
    });
  }

  ngOnInit(): void {
    this.initForm();
    this.updateReadonlyState();
  }

  private initForm(): void {
    // `user` is an optional input, so it is undefined — not null — whenever the
    // parent leaves it unbound, and a `!== null` guard let that straight
    // through into a dereference.
    if (this.user) {
      this.form.patchValue({
        ...this.user,
        birthdate: this.user.birthdate
          ? this.formatDate(this.user.birthdate)
          : null,
      });
    }
  }

  private formatDate(date: any): string {
    return dayjs(date).format('YYYY-MM-DD');
  }

  save(): void {
    this.userChange.emit(this.form.value);
    this.toggleEditMode();
  }

  cancel(): void {
    this.initForm();
    this.readonlyMode = true;
    this.updateReadonlyState();
  }

  toggleEditMode(): void {
    this.readonlyMode = !this.readonlyMode;
    this.updateReadonlyState();
  }

  private updateReadonlyState(): void {
    if (this.readonlyMode) {
      this.form.get('country')?.disable();
    } else {
      this.form.get('country')?.enable();
    }
  }
}
