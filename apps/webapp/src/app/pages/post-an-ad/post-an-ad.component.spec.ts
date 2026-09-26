import { TestBed } from '@angular/core/testing';

import { PostAnAdComponent } from './post-an-ad.component';
import { UploadService } from '../../shared/components/upload/upload.service';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

/**
 * Regression test for the DI gap tracked in CHANTIER-MODERNISATION.md §7.14,
 * now fixed. `PostAnAdComponent` injects `UploadService`
 * (`private uploadService = inject(UploadService)`). Before this fix, the
 * only provider for that service in production was
 * `UploadModule.providers` (`upload.module.ts`) — imported directly by
 * `PostAnAdModule`, the very `@NgModule` that declared `PostAnAdComponent`,
 * so `UploadService` was resolvable there via ordinary NgModule provider
 * hoisting. Commit `ea0ee06` ("PostAnAdComponent standalone: true", Phase 5)
 * dropped `UploadModule` from `PostAnAdModule`'s imports after grepping only
 * `post-an-ad.component.html` for unused template declarables — that grep
 * missed that `UploadModule` was imported for its *provider*, not for any
 * declarable the template renders directly, and silently orphaned
 * `PostAnAdComponent.uploadService`. `upload.module.ts` was later deleted as
 * dead code in `55f4d5b`, by which point the regression already existed.
 * This was a Phase 5 regression, not a pre-existing bug — confirmed by
 * inspecting `post-an-ad.module.ts` as it stood immediately before Phase 5
 * (`git show 8f954a9:...`), where `UploadModule` is a direct import
 * alongside `PostAnAdComponent`'s declaration.
 *
 * Fix: `UploadService` is now `@Injectable({ providedIn: 'root' })`
 * (`upload.service.ts`), so it no longer depends on any NgModule import
 * graph — it resolves from the root injector regardless of how
 * `PostAnAdComponent` (or any other consumer) is wired.
 *
 * `commonTestProviders` (testing-support.ts) still registers `UploadService`
 * explicitly; an explicit provider wins over `providedIn: 'root'`, so this
 * changes nothing for every other spec that relies on it.
 */
describe('PostAnAdComponent — UploadService DI (§7.14, regression fixed)', () => {
  const providersWithoutUploadService = commonTestProviders.filter(
    (provider) => provider !== UploadService
  );

  it('instantiates successfully with no explicit UploadService provider — providedIn: \'root\' resolves it on its own', async () => {
    await TestBed.configureTestingModule({
      imports: [PostAnAdComponent, ...commonTestImports],
      providers: providersWithoutUploadService,
      schemas: [...commonTestSchemas],
    }).compileComponents();

    const fixture = TestBed.createComponent(PostAnAdComponent);

    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance['uploadService']).toBeInstanceOf(UploadService);
  });

  it('instantiates successfully when UploadService is also provided explicitly (commonTestProviders) — explicit provider does not conflict with providedIn: \'root\'', async () => {
    await TestBed.configureTestingModule({
      imports: [PostAnAdComponent, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    const fixture = TestBed.createComponent(PostAnAdComponent);

    expect(fixture.componentInstance).toBeTruthy();
  });
});
