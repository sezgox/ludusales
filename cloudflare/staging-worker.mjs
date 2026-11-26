export default {
  async fetch(request, env) {
    const incoming = new URL(request.url);
    if (incoming.pathname !== '/api' && !incoming.pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    const { PREVIEW_API_ORIGIN, PREVIEW_API_CLIENT_ID, PREVIEW_API_CLIENT_SECRET } = env;
    if (!PREVIEW_API_ORIGIN || !PREVIEW_API_CLIENT_ID || !PREVIEW_API_CLIENT_SECRET) {
      return new Response('API de integración sin configurar.', { status: 503 });
    }

    const upstream = new URL(PREVIEW_API_ORIGIN);
    upstream.pathname = incoming.pathname.slice('/api'.length) || '/';
    upstream.search = incoming.search;

    const headers = new Headers({
      'CF-Access-Client-Id': PREVIEW_API_CLIENT_ID,
      'CF-Access-Client-Secret': PREVIEW_API_CLIENT_SECRET,
    });
    for (const name of ['Accept', 'Content-Type', 'If-Modified-Since', 'If-None-Match', 'Origin', 'Range']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const session = request.headers.get('Cookie')?.split(';').map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('ls_session='));
    if (session) headers.set('Cookie', session);

    const response = await fetch(new Request(upstream, request), { headers, redirect: 'manual' });
    if (response.headers.has('Location')) {
      return new Response('La API de integración no está disponible.', { status: 502 });
    }

    const result = new Response(response.body, response);
    result.headers.delete('Set-Cookie');
    for (const cookie of response.headers.getAll('Set-Cookie')) {
      if (cookie.startsWith('ls_session=')) result.headers.append('Set-Cookie', cookie);
    }
    return result;
  },
};
