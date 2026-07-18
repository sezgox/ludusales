import { Routes } from '@angular/router';
import { Landing } from './pages/landing/landing';
import { backofficeGuard } from './pages/backoffice/backoffice.guard';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
  },
  {
    path: 'backoffice',
    canActivate: [backofficeGuard],
    loadComponent: () => import('./pages/backoffice/backoffice').then((module) => module.Backoffice),
  },
  { path: '**', redirectTo: '' },
];
