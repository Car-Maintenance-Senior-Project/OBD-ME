import { TestBed } from '@angular/core/testing';

import { FuelEconomyServiceService } from './fuel-economy-service.service';

describe('FuelEconomyServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FuelEconomyServiceService = TestBed.get(FuelEconomyServiceService);
    expect(service).toBeTruthy();
  });
});
