import { TestBed } from '@angular/core/testing';

import { VINParserService } from './vinparser.service';

describe('VINParserService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VINParserService = TestBed.get(VINParserService);
    expect(service).toBeTruthy();
  });
});
