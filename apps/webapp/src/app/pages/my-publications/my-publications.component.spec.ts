import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPublicationsComponent } from './my-publications.component';
import {
  commonTestImports,
  commonTestProviders,
  commonTestSchemas,
} from '../../../testing/testing-support';

describe('MyPublicationsComponent', () => {
  let component: MyPublicationsComponent;
  let fixture: ComponentFixture<MyPublicationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MyPublicationsComponent],
      imports: [...commonTestImports],
      providers: [...commonTestProviders],
      schemas: [...commonTestSchemas],
    }).compileComponents();

    fixture = TestBed.createComponent(MyPublicationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
