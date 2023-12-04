import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PostQuickComponent } from './post-quick.component';

describe('PostQuickComponent', () => {
  let component: PostQuickComponent;
  let fixture: ComponentFixture<PostQuickComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PostQuickComponent]
    });
    fixture = TestBed.createComponent(PostQuickComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
