import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdPublisherCardComponent } from './ad-publisher-card.component';

describe('AdPublisherCardComponent', () => {
  let component: AdPublisherCardComponent;
  let fixture: ComponentFixture<AdPublisherCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdPublisherCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AdPublisherCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
