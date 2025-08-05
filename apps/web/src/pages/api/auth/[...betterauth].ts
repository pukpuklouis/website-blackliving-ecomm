import type { APIRoute } from 'astro';

export const ALL: APIRoute = async context => {
  // Proxy all auth requests to the main API server
  const API_BASE = import.meta.env.PUBLIC_API_URL || 'http://localhost:8787';
  const url = new URL(context.request.url);
  const authPath = url.pathname.replace('/api/auth', '/api/auth');
  const targetUrl = `${API_BASE}${authPath}${url.search}`;

  const response = await fetch(targetUrl, {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.method !== 'GET' ? context.request.body : undefined,
  });

  return response;
};
