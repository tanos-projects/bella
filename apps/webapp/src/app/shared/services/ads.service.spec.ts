import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { AdsService } from './ads.service';

describe('AdsService', () => {
  let service: AdsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(AdsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMyExpiredPublications', () => {
    it('fetches the expired status of my-publications', () => {
      service.getMyExpiredPublications().subscribe();

      const req = httpMock.expectOne(
        `${environment.apiBaseUrl}/publications/my-publications/expired`
      );
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });

  describe('renew', () => {
    it('posts to the ad-specific renew endpoint', () => {
      service.renew('ad-1').subscribe();

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/publications/ad-1/renew`);
      expect(req.request.method).toBe('POST');
      req.flush({ id: 'ad-1' });
    });
  });
});
