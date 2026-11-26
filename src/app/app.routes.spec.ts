import { adminGuard, authGuard } from './guards/auth.guard';
import { routes } from './app.routes';

describe('app routes', () => {
  const dashboardRoute = routes.find((route) => route.path === 'dashboard');
  const dashboardChildren = dashboardRoute?.children ?? [];

  it('protects dashboard routes with the auth guard', () => {
    expect(dashboardRoute?.canActivate).toContain(authGuard);
  });

  it('redirects /dashboard to the challenge home', () => {
    const indexRoute = dashboardChildren.find((route) => route.path === '');

    expect(indexRoute?.pathMatch).toBe('full');
    expect(indexRoute?.redirectTo).toBe('inicio');
  });

  it('registers administration section urls under the superuser guard', () => {
    const admin = routes.find((route) => route.path === 'admin');
    expect(admin?.canActivate).toContain(adminGuard);
    const sectionPaths = (admin?.children ?? [])
      .filter((route) => route.loadComponent)
      .map((route) => route.path);

    expect(sectionPaths).toEqual([
      'informacion',
      'informacion/:companyPublicId',
      'premios',
      'premios/:companyPublicId',
      'gamificacion',
      'gamificacion/:companyPublicId',
      'ranking',
      'ranking/:companyPublicId',
    ]);
  });

  it('redirects unknown dashboard urls back to dashboard', () => {
    const wildcardRoute = dashboardChildren.find((route) => route.path === '**');

    expect(wildcardRoute?.redirectTo).toBe('');
  });
});
