import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';

import { FormComponent } from './form.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

describe('FormComponent', () => {
  let component: FormComponent;
  let fixture: ComponentFixture<FormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    fixture = TestBed.createComponent(FormComponent);
    component = fixture.componentInstance;
    // The template binds [formGroup], so rendering without one throws NG01052.
    component.form = new FormGroup({ title: new FormControl('') });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits the form value on submit', (done) => {
    // submitData is an async EventEmitter, so the value arrives on a later
    // microtask rather than synchronously.
    component.submitData.subscribe((value) => {
      expect(value).toEqual({ title: 'Une annonce' });
      done();
    });

    component.form.setValue({ title: 'Une annonce' });
    component.onSubmit();
  });
});
