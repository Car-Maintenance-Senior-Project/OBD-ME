import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMaintenanceRecordPage } from './add-maintenance-record.page';

describe('AddMaintenanceRecordPage', () => {
  let component: AddMaintenanceRecordPage;
  let fixture: ComponentFixture<AddMaintenanceRecordPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddMaintenanceRecordPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddMaintenanceRecordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
