import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { AppComponent } from './app.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../testing/testing-support';
import { MyDeviceService } from './shared/services/my-device.service';
import { SearchService } from './shared/services/search.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // NxWelcomeComponent used to be declared here; the file was deleted when
      // the real shell landed, and the stale import was a compile error that
      // took the whole suite down with it.
      declarations: [AppComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders, MyDeviceService, SearchService],
      schemas: [...commonTestSchemas],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('registers French as the only language', () => {
    TestBed.createComponent(AppComponent);

    const translate = TestBed.inject(TranslateService);
    expect(translate.getLangs()).toEqual(['fr']);
    expect(translate.getCurrentLang()).toBe('fr');
  });

  it('completes its subscriptions on destroy', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    expect(() => fixture.destroy()).not.toThrow();
  });
});
