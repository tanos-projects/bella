import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdsByCategoryComponent } from './ads-by-category.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

describe('AdsByCategoryComponent', () => {
  let component: AdsByCategoryComponent;
  let fixture: ComponentFixture<AdsByCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdsByCategoryComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdsByCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
