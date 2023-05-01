import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Kind1Component } from './kind1.component';

describe('Kind1Component', () => {
  let component: Kind1Component;
  let fixture: ComponentFixture<Kind1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Kind1Component ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Kind1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
