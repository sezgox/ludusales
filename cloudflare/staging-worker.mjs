export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      url.pathname = url.pathname.slice('/api'.length) || '/';
      return env.API.fetch(new Request(url, request));
    }

    return env.ASSETS.fetch(request);
  },
};
