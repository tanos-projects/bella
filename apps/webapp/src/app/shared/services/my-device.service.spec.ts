import { TestBed } from '@angular/core/testing';
import { DeviceDetectorService, DeviceInfo } from 'ngx-device-detector';

import { MyDeviceService } from './my-device.service';

// MyDeviceService performs no HTTP call: it is a thin delegate over
// ngx-device-detector's synchronous API. There is no HTTP error path to
// cover, so the two required cases become "mobile device" vs. "desktop
// device" delegation instead.
describe('MyDeviceService', () => {
  let service: MyDeviceService;
  let deviceServiceStub: {
    getDeviceInfo: jest.Mock;
    isMobile: jest.Mock;
    isTablet: jest.Mock;
    isDesktop: jest.Mock;
  };

  beforeEach(() => {
    deviceServiceStub = {
      getDeviceInfo: jest.fn(),
      isMobile: jest.fn(),
      isTablet: jest.fn(),
      isDesktop: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        MyDeviceService,
        { provide: DeviceDetectorService, useValue: deviceServiceStub },
      ],
    });
    service = TestBed.inject(MyDeviceService);
  });

  it('reports a mobile device as mobile only (success case)', () => {
    deviceServiceStub.isMobile.mockReturnValue(true);
    deviceServiceStub.isTablet.mockReturnValue(false);
    deviceServiceStub.isDesktop.mockReturnValue(false);
    deviceServiceStub.getDeviceInfo.mockReturnValue({
      deviceType: 'mobile',
    } as DeviceInfo);

    expect(service.isMobile()).toBe(true);
    expect(service.isTablet()).toBe(false);
    expect(service.isDesktop()).toBe(false);
    expect(service.getInfo()).toEqual({ deviceType: 'mobile' });
  });

  it('reports a desktop device as desktop only (alternate case)', () => {
    deviceServiceStub.isMobile.mockReturnValue(false);
    deviceServiceStub.isTablet.mockReturnValue(false);
    deviceServiceStub.isDesktop.mockReturnValue(true);
    deviceServiceStub.getDeviceInfo.mockReturnValue({
      deviceType: 'desktop',
    } as DeviceInfo);

    expect(service.isMobile()).toBe(false);
    expect(service.isTablet()).toBe(false);
    expect(service.isDesktop()).toBe(true);
    expect(service.getInfo()).toEqual({ deviceType: 'desktop' });
  });
});
