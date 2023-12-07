import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HashtagQuickComponent } from './hashtag-quick.component';

describe('HashtagQuickComponent', () => {
  let component: HashtagQuickComponent;
  let fixture: ComponentFixture<HashtagQuickComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HashtagQuickComponent]
    });
    fixture = TestBed.createComponent(HashtagQuickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
