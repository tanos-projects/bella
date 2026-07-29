import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitledPageComponent } from './titled-page.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('TitledPageComponent', () => {
  let component: TitledPageComponent;
  let fixture: ComponentFixture<TitledPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TitledPageComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TitledPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
