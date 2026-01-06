import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { AuthProvider } from "./contexts/AuthContext";
import { EnvironmentProvider } from "./contexts/EnvironmentContext";
import { ImageUploadProvider } from "./contexts/ImageUploadContext";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export const loader: Route.LoaderFunction = ({ context }) => {
  // Extract environment variables from Cloudflare Worker context
  const env = context?.cloudflare?.env || context?.env || {};

  return {
    env: {
      PUBLIC_API_URL: env.PUBLIC_API_URL || "",
      PUBLIC_API_BASE_URL: env.PUBLIC_API_BASE_URL || "",
      PUBLIC_IMAGE_CDN_URL: env.PUBLIC_IMAGE_CDN_URL || "",
      PUBLIC_SITE_URL: env.PUBLIC_SITE_URL || "",
      PUBLIC_WEB_URL: env.PUBLIC_WEB_URL || "",
      NODE_ENV: env.NODE_ENV || "development",
    },
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

import { Toaster } from "sonner";

export default function App({ loaderData }: Route.ComponentProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <EnvironmentProvider env={loaderData?.env}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ImageUploadProvider>
            <Outlet />
            <Toaster position="top-right" richColors />
          </ImageUploadProvider>
        </AuthProvider>
      </QueryClientProvider>
    </EnvironmentProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
