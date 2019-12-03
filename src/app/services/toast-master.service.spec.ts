import { TestBed } from '@angular/core/testing';

import { ToastMasterService } from './toast-master.service';

describe('ToastMasterService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ToastMasterService = TestBed.get(ToastMasterService);
    expect(service).toBeTruthy();
  });
});
