import { TestBed } from '@angular/core/testing';

import { PostAnAdComponent } from './post-an-ad.component';
import { UploadService } from '../../shared/components/upload/upload.service';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

/**
 * Characterization test for the DI gap tracked as open question §7.14 in
 * CHANTIER-MODERNISATION.md: `PostAnAdComponent` injects `UploadService`
 * (`private uploadService = inject(UploadService)`), but the only provider
 * for that service in production (`upload.module.ts`, before it was removed
 * as dead code during Phase 5) was only ever imported by
 * `PictureUploaderFormFieldComponent`, a *descendant* of `PostAnAdComponent`
 * in the component tree — never an ancestor able to supply the injector
 * `PostAnAdComponent` itself resolves against. `git log -p --follow` on
 * `post-an-ad.component.ts` shows this injection has existed unchanged since
 * the project's initial Nx commit, so it predates this modernisation effort.
 *
 * `commonTestProviders` (testing-support.ts) registers `UploadService`
 * directly, which is why every other spec that touches this component tree
 * never surfaces the gap — the TestBed provides it out-of-band, bypassing
 * the real module graph entirely.
 *
 * This spec does NOT fix the gap (where `UploadService` should be provided
 * is a product/architecture decision, left open in §7.14). It only records,
 * empirically, what happens today when `PostAnAdComponent` is instantiated
 * without that out-of-band provider — i.e. in a DI context that mirrors
 * production's actual reachability rather than the test harness's usual
 * convenience shortcut.
 */
describe('PostAnAdComponent — characterization test for the UploadService DI gap (§7.14)', () => {
  const providersWithoutUploadService = commonTestProviders.filter(
    (provider) => provider !== UploadService
  );

  it('throws at component instantiation when no provider for UploadService is reachable — the same reachability production leaves it in', async () => {
    await TestBed.configureTestingModule({
      imports: [PostAnAdComponent, ...commonTestImports],
      providers: providersWithoutUploadService,
      schemas: [...commonTestSchemas],
    }).compileComponents();

    // Empirical result (2026-09-25): Angular 22 raises NG0201 ("No provider
    // found for `UploadService`"), not the older NullInjectorError message
    // text — the underlying error class is still a NullInjectorError, but
    // its rendered message changed format across Angular versions. Asserted
    // on the actual string observed, not assumed.
    expect(() => TestBed.createComponent(PostAnAdComponent)).toThrow(
      /NG0201: No provider found for `UploadService`/
    );
  });

  it('instantiates successfully once UploadService is provided explicitly — confirms the failure above is specifically about UploadService reachability, not some other wiring problem', async () => {
    await TestBed.configureTestingModule({
      imports: [PostAnAdComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    const fixture = TestBed.createComponent(PostAnAdComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
