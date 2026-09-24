import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogoutButtonComponent } from './logout-button.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../../testing/testing-support';

describe('AuthButtonComponent', () => {
  let component: LogoutButtonComponent;
  let fixture: ComponentFixture<LogoutButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogoutButtonComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LogoutButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
