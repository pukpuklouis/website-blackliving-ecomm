import { Button } from "@blackliving/ui";
import type React from "react";
import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";

type LoginFormProps = {
  onSuccess?: () => void;
  defaultEmail?: string;
};

const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";

export default function LoginForm({ onSuccess, defaultEmail }: LoginFormProps) {
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch(`${API_BASE}/api/auth/sign-in/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => ({}));

      if (!(response.ok && data.success)) {
        const errorMessage =
          typeof data.message === "string" && data.message
            ? data.message
            : "登入失敗，請檢查您的帳號密碼";
        setError(errorMessage);
        return;
      }

      // Store accessToken in Zustand/localStorage
      // refreshToken stays in HTTP-only cookie only (security)
      if (data.tokens && data.user) {
        setAuth({
          tokens: {
            accessToken: data.tokens.accessToken,
            refreshToken: "", // Not returned by server - stays in cookie only
            accessTokenExpiresAt: data.tokens.accessTokenExpiresAt,
            refreshTokenExpiresAt: 0, // Cookie-managed
          },
          user: data.user,
        });
      }

      onSuccess?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "登入時發生錯誤，請稍後再試";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const callbackURL = `${window.location.origin}/account/callback`;
      const response = await fetch(`${API_BASE}/api/auth/sign-in/social`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          provider: "google",
          callbackURL,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setError("Google 登入設定錯誤");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          typeof errorData.message === "string" && errorData.message
            ? errorData.message
            : "Google 登入失敗，請稍後再試";
        setError(errorMessage);
      }
    } catch {
      setError("Google 登入時發生錯誤，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="login-email"
          >
            電子郵件
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            defaultValue={defaultEmail}
            id="login-email"
            name="email"
            placeholder="your@email.com"
            required
            type="email"
          />
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="login-password"
          >
            密碼
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            id="login-password"
            name="password"
            placeholder="請輸入密碼"
            required
            type="password"
          />
        </div>

        {error.length > 0 && (
          <div className="text-center text-red-600 text-sm">{error}</div>
        )}

        <Button
          className="w-full justify-center"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "登入中..." : "登入"}
        </Button>
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-gray-300 border-t" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">或</span>
          </div>
        </div>

        <button
          className="mt-4 flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isLoading}
          onClick={handleGoogleLogin}
          type="button"
        >
          <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
            <title>Google</title>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          使用 Google 登入
        </button>
      </div>
    </div>
  );
}
