import { TestBed } from '@angular/core/testing';

import { NostrServiceService } from './nostr-service.service';

describe('NostrServiceService', () => {
  let service: NostrServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NostrServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
