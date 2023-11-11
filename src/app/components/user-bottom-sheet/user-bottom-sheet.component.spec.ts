import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBottomSheetComponent } from './user-bottom-sheet.component';

describe('UserBottomSheetComponent', () => {
  let component: UserBottomSheetComponent;
  let fixture: ComponentFixture<UserBottomSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ UserBottomSheetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBottomSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
