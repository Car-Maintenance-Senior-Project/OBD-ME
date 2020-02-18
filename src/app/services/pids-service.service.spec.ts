import { TestBed } from '@angular/core/testing';

import { PidsServiceService } from './pids-service.service';

describe('PidsServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PidsServiceService = TestBed.get(PidsServiceService);
    expect(service).toBeTruthy();
  });
});
