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
    loadComponent: () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard),
  },
  { path: '**', redirectTo: '' },
];
