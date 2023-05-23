import { TestBed } from '@angular/core/testing';

import { Nip05Service } from './nip05.service';

describe('Nip05Service', () => {
  let service: Nip05Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nip05Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
