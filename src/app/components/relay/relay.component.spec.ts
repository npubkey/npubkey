import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelayComponent } from './relay.component';

describe('RelayComponent', () => {
  let component: RelayComponent;
  let fixture: ComponentFixture<RelayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RelayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RelayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
