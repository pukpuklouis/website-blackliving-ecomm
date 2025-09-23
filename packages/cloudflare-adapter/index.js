import { createRequestHandler } from "react-router";

function isPagesContext(arg) {
  return (
    typeof arg === "object" &&
    arg !== null &&
    typeof arg.request === "object" &&
    arg.request instanceof Request &&
    typeof arg.waitUntil === "function"
  );
}

function createAssetNext(env) {
  if (env && typeof env.ASSETS?.fetch === "function") {
    return (request) => env.ASSETS.fetch(request);
  }
  return null;
}

export function createPagesFunctionHandler({ build, getLoadContext, mode } = {}) {
  if (!build) {
    throw new TypeError("createPagesFunctionHandler requires a server build");
  }

  const handleRequest = createRequestHandler(build, mode);

  async function handle(request, loadContext, next) {
    try {
      const response = await handleRequest(request, loadContext);
      if (response.status === 404 && next) {
        const assetResponse = await next(request);
        if (assetResponse && assetResponse.status !== 404) {
          return assetResponse;
        }
      }
      return response;
    } catch (error) {
      console.error(error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  return async function handleInvocation(arg1, arg2, arg3) {
    if (isPagesContext(arg1)) {
      const context = arg1;
      const loadContext = getLoadContext
        ? await getLoadContext({
            request: context.request,
            context,
            env: context.env,
            params: context.params ?? {},
          })
        : undefined;
      const next = context.next ? () => context.next() : createAssetNext(context.env);
      return handle(context.request, loadContext, next);
    }

    const request = arg1;
    const env = arg2 ?? {};
    const executionCtx = arg3 ?? {};
    const waitUntil = typeof executionCtx.waitUntil === "function"
      ? executionCtx.waitUntil.bind(executionCtx)
      : () => {};
    const syntheticContext = {
      request,
      env,
      params: {},
      waitUntil,
    };
    const loadContext = getLoadContext
      ? await getLoadContext({
          request,
          context: syntheticContext,
          env,
          params: syntheticContext.params,
        })
      : undefined;
    const next = createAssetNext(env);
    return handle(request, loadContext, next);
  };
}
