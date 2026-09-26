import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormlyBootstrapModule } from '@ngx-formly/bootstrap';

import { AdFormComponent } from './ad-form.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../../testing/testing-support';

describe('AdFormComponent', () => {
  let component: AdFormComponent;
  let fixture: ComponentFixture<AdFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // FormlyBootstrapModule registers ngx-formly's base field types
      // (input/select/textarea/multicheckbox) — app-wide via AppModule in
      // production. Standalone AdFormComponent now really imports
      // FormComponent (previously an unknown element under
      // NO_ERRORS_SCHEMA, never actually rendered by this spec), so
      // ngOnInit's real Formly `fields` config now deep-renders through
      // <formly-form> and needs these types resolvable, or it throws.
      imports: [AdFormComponent, FormlyBootstrapModule, ...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
