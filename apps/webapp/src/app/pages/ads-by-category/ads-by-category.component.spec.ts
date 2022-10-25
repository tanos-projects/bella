import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdsByCategoryComponent } from './ads-by-category.component';

describe('AdsByCategoryComponent', () => {
  let component: AdsByCategoryComponent;
  let fixture: ComponentFixture<AdsByCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdsByCategoryComponent ]
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
