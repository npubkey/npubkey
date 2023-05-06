import { TestBed } from '@angular/core/testing';

import { ContentParserService } from './content-parser.service';

describe('ContentParserService', () => {
  let service: ContentParserService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContentParserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
