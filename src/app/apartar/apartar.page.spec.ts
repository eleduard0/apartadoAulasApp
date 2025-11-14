import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ApartarPage } from './apartar.page';

describe('ApartarPage', () => {
  let component: ApartarPage;
  let fixture: ComponentFixture<ApartarPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ApartarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
