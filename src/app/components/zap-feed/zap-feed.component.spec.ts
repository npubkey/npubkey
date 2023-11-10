import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ZapFeedComponent } from './zap-feed.component';

describe('ZapFeedComponent', () => {
  let component: ZapFeedComponent;
  let fixture: ComponentFixture<ZapFeedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ZapFeedComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ZapFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
