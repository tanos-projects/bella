import { TestBed } from '@angular/core/testing';

import { DrawerService } from './drawer.service';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('DrawerService', () => {
  let service: DrawerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    });
    service = TestBed.inject(DrawerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
