import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { FieldErrorComponent } from './field-error.component';

describe('FieldErrorComponent', () => {
  let component: FieldErrorComponent;
  let fixture: ComponentFixture<FieldErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FieldErrorComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FieldErrorComponent);
    component = fixture.componentInstance;
  });

  function errorText(): string | null {
    const el: HTMLElement | null = fixture.nativeElement.querySelector('.invalid-feedback');
    return el ? (el.textContent ?? '').trim() : null;
  }

  it('renders nothing when there is no control', () => {
    fixture.detectChanges();
    expect(errorText()).toBeNull();
  });

  it('renders nothing while the control is untouched, even if invalid', () => {
    component.control = new FormControl('', Validators.required);
    fixture.detectChanges();

    expect(errorText()).toBeNull();
  });

  it('renders the labeled "required" message once the control is touched and invalid', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;
    component.label = "Nom d'utilisateur";
    fixture.detectChanges();

    expect(errorText()).toBe("Nom d'utilisateur est obligatoire");
  });

  it('renders the "email" message for a malformed email', () => {
    const control = new FormControl('not-an-email', Validators.email);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    expect(errorText()).toBe("L'adresse mail n'est pas valide");
  });

  it('renders nothing once the control becomes valid', () => {
    const control = new FormControl('john', Validators.required);
    control.markAsTouched();
    component.control = control;
    fixture.detectChanges();

    expect(errorText()).toBeNull();
  });
});
