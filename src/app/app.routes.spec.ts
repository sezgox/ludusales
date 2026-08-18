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

  it('registers the four dashboard section urls', () => {
    const sectionPaths = dashboardChildren
      .filter((route) => route.loadComponent)
      .map((route) => route.path);

    expect(sectionPaths).toEqual(['informacion', 'premios', 'gamificacion', 'ranking']);
  });

  it('redirects unknown dashboard urls back to dashboard', () => {
    const wildcardRoute = dashboardChildren.find((route) => route.path === '**');

    expect(wildcardRoute?.redirectTo).toBe('');
  });
});
