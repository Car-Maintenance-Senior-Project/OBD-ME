import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ErrorModalPage } from './error-modal.page';

describe('ErrorModalPage', () => {
  let component: ErrorModalPage;
  let fixture: ComponentFixture<ErrorModalPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ErrorModalPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ErrorModalPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
