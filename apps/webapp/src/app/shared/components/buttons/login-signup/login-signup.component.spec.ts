import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSignupComponent } from './login-signup.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../../testing/testing-support';

describe('AuthButtonComponent', () => {
  let component: LoginSignupComponent;
  let fixture: ComponentFixture<LoginSignupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginSignupComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginSignupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
