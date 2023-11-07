import { TestBed } from '@angular/core/testing';

import { NostrBandApiService } from './nostr-band-api.service';

describe('NostrBandApiService', () => {
  let service: NostrBandApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NostrBandApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
