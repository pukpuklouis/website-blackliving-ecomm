export interface PagesFunctionContext<Env = unknown> {
  request: Request;
  env: Env;
  params: Record<string, string>;
  waitUntil(promise: Promise<unknown>): void;
  next?: (request: Request) => Promise<Response>;
}

export interface CreatePagesFunctionHandlerArgs<Env = unknown> {
  build: unknown;
  mode?: string;
  getLoadContext?: (args: {
    request: Request;
    context: PagesFunctionContext<Env>;
    env: Env;
    params: Record<string, string>;
  }) => unknown | Promise<unknown>;
}

export type PagesFunctionHandler<Env = unknown> = (
  context: PagesFunctionContext<Env>
) => Promise<Response>;

export function createPagesFunctionHandler<Env = unknown>(
  init: CreatePagesFunctionHandlerArgs<Env>
): PagesFunctionHandler<Env> &
  ((
    request: Request,
    env?: Env,
    context?: { waitUntil?: (promise: Promise<unknown>) => void }
  ) => Promise<Response>);
