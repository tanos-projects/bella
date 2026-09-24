import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { AdCardComponent } from './ad-card.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('AdCardComponent', () => {
  let component: AdCardComponent;
  let fixture: ComponentFixture<AdCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdCardComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdCardComponent);
    component = fixture.componentInstance;
    // ngOnInit dereferences `data`, so the input has to be set before the
    // first change detection rather than after it.
    component.data = { category: 'voitures', title: 'Ma voiture', id: '1' } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('builds a slugged detail URL from the ad', () => {
    expect(component.urlPath).toEqual([
      '/annonces/voitures/',
      'ma-voiture',
      '1',
    ]);
  });

  it('strips diacritics and encodes the slug', () => {
    const fresh = TestBed.createComponent(AdCardComponent);
    fresh.componentInstance.data = {
      category: 'immobilier',
      title: '  Maison à Rénover  ',
      id: '2',
    } as any;
    fresh.detectChanges();

    expect(fresh.componentInstance.urlPath[1]).toBe('maison-a-renover');
  });

  it('navigates to the detail URL', () => {
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.goToDetail();

    expect(navigate).toHaveBeenCalledWith(component.urlPath);
  });
});
