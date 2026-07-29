import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdFormComponent } from './ad-form.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('AdFormComponent', () => {
  let component: AdFormComponent;
  let fixture: ComponentFixture<AdFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdFormComponent ],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
