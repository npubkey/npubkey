import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListedUserComponent } from './listed-user.component';

describe('ListedUserComponent', () => {
  let component: ListedUserComponent;
  let fixture: ComponentFixture<ListedUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ListedUserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListedUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
