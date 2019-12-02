import { TestBed } from '@angular/core/testing';

import { OBDConnectorService } from './obd-connector.service';

describe('OBDConnectorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OBDConnectorService = TestBed.get(OBDConnectorService);
    expect(service).toBeTruthy();
  });
});
