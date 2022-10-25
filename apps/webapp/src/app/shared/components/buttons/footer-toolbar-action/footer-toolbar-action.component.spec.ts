import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FooterToolbarActionComponent } from './footer-toolbar-action.component';

describe('FooterToolbarActionComponent', () => {
  let component: FooterToolbarActionComponent;
  let fixture: ComponentFixture<FooterToolbarActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FooterToolbarActionComponent]
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
