import type { APIRoute } from 'astro';
import { auth } from '@blackliving/auth';

export const ALL: APIRoute = async (context) => {
  return auth.handler(context.request);
};