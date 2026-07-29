import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterToolbarActionComponent } from './footer-toolbar-action.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../../testing/testing-support';

describe('FooterToolbarActionComponent', () => {
  let component: FooterToolbarActionComponent;
  let fixture: ComponentFixture<FooterToolbarActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FooterToolbarActionComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterToolbarActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
