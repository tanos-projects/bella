import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdPublisherCardComponent } from './ad-publisher-card.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('AdPublisherCardComponent', () => {
  let component: AdPublisherCardComponent;
  let fixture: ComponentFixture<AdPublisherCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdPublisherCardComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    fixture = TestBed.createComponent(AdPublisherCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
