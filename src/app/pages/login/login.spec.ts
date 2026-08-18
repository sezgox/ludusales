import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('switches between access code and contact modes', () => {
    component.showContactForm();
    expect(component.mode()).toBe('contact');

    component.showAccessCodeForm();
    expect(component.mode()).toBe('access-code');
  });

  it('marks the form as touched when submitted invalid', async () => {
    await component.submit();

    expect(component.form.touched).toBe(true);
    expect(component.status()).toBe('idle');
  });
});
