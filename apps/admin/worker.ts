import { createPagesFunctionHandler } from "@remix-run/cloudflare";
import * as build from "./build/server/index.js";

type Env = Record<string, unknown> & {
  ASSETS?: { fetch(request: Request): Promise<Response> };
};

type ExecutionContext = { waitUntil(promise: Promise<unknown>): void };

const handleRequest = createPagesFunctionHandler<Env>({
  build,
  getLoadContext({ env, context, params }) {
    return {
      env,
      params,
      waitUntil: context.waitUntil.bind(context),
    };
  },
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    return handleRequest(request, env, ctx);
  },
};

export const onRequest = handleRequest;
