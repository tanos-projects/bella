import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TitledPageComponent } from './titled-page.component';

describe('TitledPageComponent', () => {
  let component: TitledPageComponent;
  let fixture: ComponentFixture<TitledPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TitledPageComponent]
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
