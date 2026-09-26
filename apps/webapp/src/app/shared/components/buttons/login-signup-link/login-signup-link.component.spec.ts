import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSignupLinkComponent } from './login-signup-link.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../../testing/testing-support';

describe('AuthButtonComponent', () => {
  let component: LoginSignupLinkComponent;
  let fixture: ComponentFixture<LoginSignupLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginSignupLinkComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginSignupLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
