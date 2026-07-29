import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileFormComponent } from './profile-form.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../../testing/testing-support';
import { CountriesService } from '../../../../shared/services/countries.service';

describe('ProfileFormComponent', () => {
  let component: ProfileFormComponent;
  let fixture: ComponentFixture<ProfileFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileFormComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders, CountriesService],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProfileFormComponent);
    component = fixture.componentInstance;
  });

  // ngOnInit is called directly rather than through detectChanges: the
  // template binds formControlName to custom controls whose value accessors
  // are out of scope here, and it is the component's own logic under test.
  it('should create without a user bound', () => {
    // `user` is an optional input: undefined rather than null when the parent
    // leaves it unbound, which used to crash ngOnInit.
    component.ngOnInit();

    expect(component).toBeTruthy();
    expect(component.form.get('username')?.value).toBeNull();
  });

  it('patches the form from the bound user', () => {
    component.user = {
      username: 'jdoe',
      email: 'jdoe@example.com',
      firstname: 'John',
      lastname: 'Doe',
      mobilePhone: '+33600000000',
      country: 'FR',
    } as any;
    component.ngOnInit();

    expect(component.form.get('username')?.value).toBe('jdoe');
    expect(component.form.get('email')?.value).toBe('jdoe@example.com');
  });

  it('formats the birthdate as YYYY-MM-DD', () => {
    component.user = {
      username: 'jdoe',
      birthdate: '1990-06-15T00:00:00Z',
    } as any;
    component.ngOnInit();

    expect(component.form.get('birthdate')?.value).toBe('1990-06-15');
  });

  it('requires a username, an email, a phone and a country', () => {
    component.ngOnInit();

    expect(component.form.valid).toBe(false);

    component.form.patchValue({
      username: 'jdoe',
      email: 'jdoe@example.com',
      mobilePhone: '+33600000000',
      country: 'FR',
    });

    expect(component.form.valid).toBe(true);
  });
});
