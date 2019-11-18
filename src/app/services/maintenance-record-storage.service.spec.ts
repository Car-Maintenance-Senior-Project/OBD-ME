import { TestBed } from '@angular/core/testing';

import { MaintenanceRecordStorageService } from './maintenance-record-storage.service';

describe('MaintenanceRecordStorageService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: MaintenanceRecordStorageService = TestBed.get(MaintenanceRecordStorageService);
    expect(service).toBeTruthy();
  });
});
