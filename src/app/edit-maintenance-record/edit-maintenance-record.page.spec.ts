import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditMaintenanceRecordPage } from './edit-maintenance-record.page';

describe('EditMaintenanceRecordPage', () => {
  let component: EditMaintenanceRecordPage;
  let fixture: ComponentFixture<EditMaintenanceRecordPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditMaintenanceRecordPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditMaintenanceRecordPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
