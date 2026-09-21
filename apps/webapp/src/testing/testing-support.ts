import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from '@auth0/auth0-angular';
import { provideTranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';

import { ModalModule } from 'ngx-bootstrap/modal';

import { AuthCustomService } from '../app/auth/auth-custom.service';
import { AuthUserService } from '../app/auth/auth-user.service';
import { HomeService } from '../app/pages/home/home.service';
import { WelcomeService } from '../app/pages/welcome/welcome.service';
import { DrawerService } from '../app/shared/components/drawer/drawer.service';
import { LoadingService } from '../app/shared/components/loading/loading.service';
import { UploadService } from '../app/shared/components/upload/upload.service';
import { MyDeviceService } from '../app/shared/services/my-device.service';
import { SearchService } from '../app/shared/services/search.service';
import { UserSettingsService } from '../app/shared/services/user-settings.service';

/**
 * Shared setup for the component smoke tests.
 *
 * The generated specs declared their component and nothing else, which stopped
 * working as soon as the components grew dependencies. Rather than mock every
 * app service, the real ones are provided on top of Angular's testing modules —
 * a missing provider then fails the test for a real reason instead of a
 * missing stub. Only Auth0 is faked, since it would otherwise try to reach a
 * tenant.
 */

/** Stands in for Auth0's SDK, which needs a real tenant to initialise. */
export const mockAuthService: Partial<AuthService> = {
  isAuthenticated$: of(false),
  isLoading$: of(false),
  user$: of(null),
  error$: EMPTY,
  loginWithRedirect: jest.fn().mockReturnValue(EMPTY),
  logout: jest.fn().mockReturnValue(EMPTY),
  getAccessTokenSilently: jest.fn().mockReturnValue(of('token')),
};

export const commonTestImports = [
  HttpClientTestingModule,
  RouterTestingModule,
  ReactiveFormsModule,
  NoopAnimationsModule,
  // BsModalService is injected by the upload component and pulls in
  // RendererFactory2, which forRoot() wires up.
  ModalModule.forRoot(),
];

/**
 * The app's own services are plain `@Injectable()` — declared in a module's
 * providers rather than `providedIn: 'root'` — so a TestBed has to list them
 * explicitly. They are only instantiated when a component actually injects
 * one, so providing the set here costs nothing per spec.
 */
export const commonTestProviders = [
  { provide: AuthService, useValue: mockAuthService },
  provideTranslateService(),
  AuthCustomService,
  AuthUserService,
  DrawerService,
  HomeService,
  LoadingService,
  MyDeviceService,
  SearchService,
  UploadService,
  UserSettingsService,
  WelcomeService,
];

/**
 * NO_ERRORS_SCHEMA keeps a component's own creation under test rather than its
 * children's — these specs assert that the component instantiates, not that
 * the whole template tree renders.
 */
export const commonTestSchemas = [NO_ERRORS_SCHEMA];
