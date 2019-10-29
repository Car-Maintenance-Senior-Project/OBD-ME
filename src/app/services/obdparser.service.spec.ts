import { TestBed } from '@angular/core/testing';

import { OBDParserService } from './obdparser.service';

describe('OBDParserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OBDParserService = TestBed.get(OBDParserService);
    expect(service).toBeTruthy();
  });
});
