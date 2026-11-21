import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactForm } from './contact-form';

describe('ContactForm', () => {
  let component: ContactForm;
  let fixture: ComponentFixture<ContactForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactForm],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactForm);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('marks the form as touched when submitted invalid', async () => {
    await component.submit();

    expect(component.form.touched).toBe(true);
    expect(component.status()).toBe('idle');
  });

  it('sends all fields and preserves the selected goals', async () => {
    component.form.patchValue({
      firstName: 'Ana Pérez', email: 'ana@example.com', company: 'Empresa', teamSize: '8 a 25',
      role: 'Directora', phone: '600123456', goals: ['Captar nuevos clientes'],
      founderInterest: 'Solo quiero información', source: 'LinkedIn', message: 'Más información',
    });
    const result = component.submit();
    const request = TestBed.inject(HttpTestingController).expectOne((req) => req.url.endsWith('/contact'));
    expect(request.request.body).toMatchObject({ role: 'Directora', goals: ['Captar nuevos clientes'], message: 'Más información' });
    request.flush({});
    await result;
    expect(component.status()).toBe('sent');
  });
});
