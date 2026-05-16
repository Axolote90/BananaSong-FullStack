import { TestBed } from '@angular/core/testing';

import { Level } from './level';

describe('Level', () => {
  let service: Level;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Level);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
