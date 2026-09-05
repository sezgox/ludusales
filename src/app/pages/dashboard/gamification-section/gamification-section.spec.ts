import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GamificationSection } from './gamification-section';

describe('GamificationSection', () => {
  let fixture: ComponentFixture<GamificationSection>;
  let component: GamificationSection;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamificationSection],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(GamificationSection);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('companyPublicId', 'company-id');
    fixture.componentRef.setInput('isSuperuser', true);
    fixture.detectChanges();
    await fixture.whenStable();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('marks every invalid required field after trying to create a draft', async () => {
    component.createForm.setValue({
      description: '<p></p>',
      startAt: '',
      endAt: '',
      goal: '12.345',
      valuePrecision: 2,
      goalUnit: '   ',
    });

    await component.createGamification(document.createElement('dialog'));
    fixture.detectChanges();

    expect(component.createFeedback()).toContain('campos marcados');
    expect(fixture.nativeElement.querySelector('[role="textbox"]').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-start-at').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-end-at').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-goal').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-goal-unit').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('.field-error')).toHaveLength(5);
    httpMock.expectNone(() => true);
  });

  it('marks the end date when it is not later than the start date', async () => {
    component.createForm.setValue({
      description: '<p>Reto válido</p>',
      startAt: '2027-01-02T09:00',
      endAt: '2027-01-01T09:00',
      goal: '100.00',
      valuePrecision: 2,
      goalUnit: 'ventas',
    });

    await component.createGamification(document.createElement('dialog'));
    fixture.detectChanges();

    const endInput: HTMLInputElement = fixture.nativeElement.querySelector('#create-end-at');
    expect(endInput.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-end-at-error').textContent).toContain('posterior al inicio');
    httpMock.expectNone(() => true);
  });
});
