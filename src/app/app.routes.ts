import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Landing } from './pages/landing/landing';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
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
