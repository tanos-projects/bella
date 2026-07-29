import { TestBed } from '@angular/core/testing';

import { UploadService } from './upload.service';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    });
    service = TestBed.inject(UploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
