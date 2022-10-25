import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginSignupLinkComponent } from './login-signup-link.component';

describe('AuthButtonComponent', () => {
  let component: LoginSignupLinkComponent;
  let fixture: ComponentFixture<LoginSignupLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoginSignupLinkComponent]
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
