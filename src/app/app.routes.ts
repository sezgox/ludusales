import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    data: { landingPage: 'home' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'gamificacion',
    data: { landingPage: 'gamification' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'como-funciona',
    data: { landingPage: 'how-it-works' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'campana-piloto',
    data: { landingPage: 'pilot-campaign' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'nosotros',
    data: { landingPage: 'about-us' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'informacion',
      },
      {
        path: 'informacion',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'informacion/:companyPublicId',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'premios',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'premios/:companyPublicId',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'gamificacion',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'gamificacion/:companyPublicId',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'ranking',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: 'ranking/:companyPublicId',
        loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
      },
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
