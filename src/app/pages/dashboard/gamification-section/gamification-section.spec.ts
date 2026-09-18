import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { icons, isLucideIconComponent, provideLucideIcons } from '@lucide/angular';
import { GamificationSection } from './gamification-section';

describe('GamificationSection', () => {
  let fixture: ComponentFixture<GamificationSection>;
  let component: GamificationSection;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamificationSection],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideLucideIcons(...Object.values(icons).filter(isLucideIconComponent))],
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
      title: '',
      description: '<p></p>',
      startAt: '',
      endAt: '',
      goal: '12.345',
      valuePrecision: 2,
      goalUnit: '   ',
      rules: [],
    });

    await component.createGamification(document.createElement('dialog'));
    fixture.detectChanges();

    expect(component.createFeedback()).toContain('campos marcados');
    expect(fixture.nativeElement.querySelector('#create-title').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="textbox"]').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-start-at').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-end-at').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-goal').getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-goal-unit').getAttribute('aria-invalid')).toBe('false');
    expect(fixture.nativeElement.querySelectorAll('.field-error')).toHaveLength(5);
    httpMock.expectNone(() => true);
  });

  it('loads editable rule presets when creating a gamification', () => {
    component.openCreateDialog({ showModal: () => undefined } as HTMLDialogElement);

    expect(component.createForm.controls.rules.getRawValue()).toEqual([
      { position: 1, title: 'Ventas cerradas', description: 'Suma puntos por cada venta realizada.', iconName: 'chart-column' },
      { position: 2, title: 'Productos estratégicos', description: 'Multiplica tus puntos al vender productos clave.', iconName: 'award' },
      { position: 3, title: 'Calidad y satisfacción', description: 'Las encuestas y la calidad también cuentan.', iconName: 'star' },
    ]);

    expect(component.createForm.controls.rules.controls).toHaveLength(3);
  });

  it('marks the end date when it is not later than the start date', async () => {
    component.createForm.setValue({
      title: 'Reto válido',
      description: '<p>Reto válido</p>',
      startAt: '2027-01-02T09:00',
      endAt: '2027-01-01T09:00',
      goal: '100.00',
      valuePrecision: 2,
      goalUnit: 'ventas',
      rules: [],
    });

    await component.createGamification(document.createElement('dialog'));
    fixture.detectChanges();

    const endInput: HTMLInputElement = fixture.nativeElement.querySelector('#create-end-at');
    expect(endInput.getAttribute('aria-invalid')).toBe('true');
    expect(fixture.nativeElement.querySelector('#create-end-at-error').textContent).toContain('posterior al inicio');
    httpMock.expectNone(() => true);
  });
});
