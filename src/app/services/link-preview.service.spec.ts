import { TestBed } from '@angular/core/testing';

import { LinkPreviewService } from './link-preview.service';

describe('LinkPreviewService', () => {
  let service: LinkPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LinkPreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
