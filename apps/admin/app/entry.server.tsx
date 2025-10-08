import type { AppLoadContext, EntryContext } from 'react-router';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import { renderToReadableStream } from 'react-dom/server.edge';

export const streamTimeout = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  const body = await renderToReadableStream(
    <ServerRouter context={routerContext} url={request.url} />,
    {
      signal: request.signal,
      onError(error) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  const userAgent = request.headers.get('user-agent');
  if ((routerContext.isSpaMode || (userAgent && isbot(userAgent))) && body.allReady) {
    await Promise.race([
      body.allReady,
      new Promise((resolve) => setTimeout(resolve, streamTimeout)),
    ]);
  }

  responseHeaders.set('Content-Type', 'text/html');

  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
