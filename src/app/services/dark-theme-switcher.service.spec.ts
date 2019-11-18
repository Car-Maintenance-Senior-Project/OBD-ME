import { TestBed } from '@angular/core/testing';

import { DarkThemeSwitcherService } from './dark-theme-switcher.service';

describe('DarkThemeSwitcherService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DarkThemeSwitcherService = TestBed.get(DarkThemeSwitcherService);
    expect(service).toBeTruthy();
  });
});
