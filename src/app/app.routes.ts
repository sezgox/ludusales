import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

const loadPortal = () => import('./pages/challenge-portal/challenge-portal').then((module) => module.ChallengePortal);
const loadAdmin = () => import('./pages/dashboard/dashboard').then((module) => module.Dashboard);

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
    path: 'funcionamiento',
    data: { landingPage: 'how-it-works' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'piloto',
    data: { landingPage: 'pilot-campaign' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'nosotros',
    data: { landingPage: 'about-us' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'contacto',
    data: { landingPage: 'contact' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'blog',
    data: { landingPage: 'blog' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'blog/:slug',
    data: { landingPage: 'blog' },
    loadComponent: () => import('./pages/landing/landing').then((module) => module.Landing),
  },
  {
    path: 'tv',
    loadComponent: () => import('./pages/public-tv/public-tv').then((module) => module.PublicTv),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      ...['inicio', 'ranking', 'misiones', 'insignias', 'equipos', 'enfrentamientos', 'premios', 'reto', 'historico', 'mas', 'tv'].map((path) => ({ path, data: { section: path }, loadComponent: loadPortal })),
      { path: 'ficha/:participantCode', data: { section: 'ficha' }, loadComponent: loadPortal },
      ...['informacion', 'gamificacion'].flatMap((section) => [
        { path: section, data: { section: 'inicio' }, loadComponent: loadPortal },
        { path: section + '/:companyPublicId', data: { section: 'inicio' }, loadComponent: loadPortal },
      ]),
      ...['premios', 'ranking'].map((section) => ({ path: section + '/:companyPublicId', data: { section }, loadComponent: loadPortal })),
      { path: '**', redirectTo: '' },
    ],
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'informacion',
      },
      ...['informacion', 'premios', 'gamificacion', 'ranking'].flatMap((section) => [
        { path: section, loadComponent: loadAdmin },
        { path: section + '/:companyPublicId', loadComponent: loadAdmin },
      ]),
      {
        path: '**',
        redirectTo: '',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
