import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';

import { MyPublicationsComponent } from './my-publications.component';
import { AdDTO } from '../../shared/models/ads.model';
import { AdsService } from '../../shared/services/ads.service';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

describe('MyPublicationsComponent', () => {
  let component: MyPublicationsComponent;
  let fixture: ComponentFixture<MyPublicationsComponent>;
  let adsService: jest.Mocked<
    Pick<
      AdsService,
      | 'getMyPublishedPublications'
      | 'getMySubmittedPublications'
      | 'getMyDraftPublications'
      | 'getMyExpiredPublications'
      | 'renew'
    >
  >;

  beforeEach(async () => {
    adsService = {
      getMyPublishedPublications: jest.fn().mockReturnValue(of([])),
      getMySubmittedPublications: jest.fn().mockReturnValue(of([])),
      getMyDraftPublications: jest.fn().mockReturnValue(of([])),
      getMyExpiredPublications: jest
        .fn()
        .mockReturnValue(of([{ id: 'ad-1' } as AdDTO])),
      renew: jest.fn().mockReturnValue(of({ id: 'ad-1' } as AdDTO)),
    };

    await TestBed.configureTestingModule({
      imports: [MyPublicationsComponent, ...commonTestImports],
      providers: [...commonTestProviders, { provide: AdsService, useValue: adsService }],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads the expired publications list', (done) => {
    component.expiredPublications$.subscribe((ads) => {
      expect(ads).toEqual([{ id: 'ad-1' }]);
      done();
    });
  });

  it('renews an ad and refreshes the published and expired lists', () => {
    component.renew('ad-1');

    expect(adsService.renew).toHaveBeenCalledWith('ad-1');
    expect(component.renewingId).toBeNull();
    // Once from the initial load, once from the refresh a successful renew triggers.
    expect(adsService.getMyPublishedPublications).toHaveBeenCalledTimes(2);
    expect(adsService.getMyExpiredPublications).toHaveBeenCalledTimes(2);
  });

  it('marks the ad as renewing until the call settles', () => {
    const pending = new Subject<AdDTO>();
    adsService.renew.mockReturnValue(pending);

    component.renew('ad-1');
    expect(component.renewingId).toBe('ad-1');

    pending.next({ id: 'ad-1' } as AdDTO);
    pending.complete();
    expect(component.renewingId).toBeNull();
  });

  it('clears the renewing flag without refreshing when the call fails', () => {
    const pending = new Subject<AdDTO>();
    adsService.renew.mockReturnValue(pending);

    component.renew('ad-1');
    const callsBeforeError = adsService.getMyExpiredPublications.mock.calls.length;
    pending.error(new Error('boom'));

    expect(component.renewingId).toBeNull();
    expect(adsService.getMyExpiredPublications).toHaveBeenCalledTimes(callsBeforeError);
  });
});
