import { authGuard } from './guards/auth.guard';
import { routes } from './app.routes';

describe('app routes', () => {
  const dashboardRoute = routes.find((route) => route.path === 'dashboard');
  const dashboardChildren = dashboardRoute?.children ?? [];

  it('protects dashboard routes with the auth guard', () => {
    expect(dashboardRoute?.canActivate).toContain(authGuard);
  });

  it('redirects /dashboard to the main information section', () => {
    const indexRoute = dashboardChildren.find((route) => route.path === '');

    expect(indexRoute?.pathMatch).toBe('full');
    expect(indexRoute?.redirectTo).toBe('informacion');
  });

  it('registers dashboard section urls with and without company public ids', () => {
    const sectionPaths = dashboardChildren
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
