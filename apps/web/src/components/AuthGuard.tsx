import { checkSession } from "@blackliving/auth/client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type AuthGuardProps = {
  children: ReactNode;
  fallback?: string;
  loadingComponent?: ReactNode;
};

/**
 * Client-side authentication guard component.
 * Checks session via API and redirects to login if not authenticated.
 */
export function AuthGuard({
  children,
  fallback = "/login",
  loadingComponent,
}: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function verifySession() {
      try {
        const session = await checkSession();

        if (session.authenticated && session.user) {
          setIsAuthenticated(true);
        } else {
          // Build redirect URL with current path
          const currentPath = window.location.pathname + window.location.search;
          const loginUrl = `${fallback}${fallback.includes("?") ? "&" : "?"}redirect=${encodeURIComponent(currentPath)}`;
          window.location.href = loginUrl;
        }
      } catch (error) {
        console.error("[AuthGuard] Session check failed:", error);
        window.location.href = fallback;
      } finally {
        setIsLoading(false);
      }
    }

    verifySession();
  }, [fallback]);

  if (isLoading) {
    return (
      loadingComponent ?? (
        <div className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
            <p className="text-gray-600">驗證中...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    // Will redirect, but show loading while redirecting
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
          <p className="text-gray-600">正在跳轉到登入頁面...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default AuthGuard;
