import { Button } from "@blackliving/ui";
import type React from "react";
import { useState } from "react";
import { useAuthStore } from "../../stores/authStore";

type RegisterFormProps = {
  onSuccess?: () => void;
  defaultEmail?: string;
};

const API_BASE = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";

export default function RegisterForm({
  onSuccess,
  defaultEmail,
}: RegisterFormProps) {
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const performAutoLogin = async () => {
    try {
      const sessionResponse = await fetch(`${API_BASE}/api/auth/session`, {
        credentials: "include",
      });
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData?.user) {
          setUser(sessionData.user);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Auto login check failed", err);
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;

    try {
      const response = await fetch(`${API_BASE}/api/auth/sign-up/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
          name: name || undefined,
          phone: phone || undefined,
        }),
      });

      if (response.ok) {
        setSuccess("註冊成功！正在為您登入...");
        const loggedIn = await performAutoLogin();
        setTimeout(() => onSuccess?.(), loggedIn ? 1000 : 1500);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "註冊失敗，該電子郵件可能已被使用");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("註冊時發生錯誤，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);
    setError(null);

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
          setError("Google 註冊設定錯誤");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Google 註冊失敗，請稍後再試");
      }
    } catch (err) {
      console.error("Google register error:", err);
      setError("Google 註冊時發生錯誤，請稍後再試");
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
            htmlFor="register-email"
          >
            電子郵件 *
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            defaultValue={defaultEmail}
            id="register-email"
            name="email"
            placeholder="your@email.com"
            required
            type="email"
          />
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="register-password"
          >
            密碼 *
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            id="register-password"
            minLength={6}
            name="password"
            placeholder="至少6個字元"
            required
            type="password"
          />
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="register-name"
          >
            姓名
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            id="register-name"
            name="name"
            placeholder="您的姓名"
            type="text"
          />
        </div>

        <div>
          <label
            className="block font-medium text-gray-700 text-sm"
            htmlFor="register-phone"
          >
            手機號碼
          </label>
          <input
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-black focus:outline-none focus:ring-black"
            id="register-phone"
            name="phone"
            placeholder="09xxxxxxxx"
            type="tel"
          />
        </div>

        <div className="flex items-center">
          <input
            className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
            id="register-terms"
            name="terms"
            required
            type="checkbox"
          />
          <label
            className="ml-2 block text-gray-900 text-sm"
            htmlFor="register-terms"
          >
            我同意
            <a className="mx-1 text-black hover:underline" href="/terms">
              服務條款
            </a>
            和
            <a className="mx-1 text-black hover:underline" href="/privacy">
              隱私政策
            </a>
          </label>
        </div>

        {error ? (
          <div className="text-center text-red-600 text-sm">{error}</div>
        ) : null}
        {success ? (
          <div className="text-center text-green-600 text-sm">{success}</div>
        ) : null}

        <Button
          className="w-full justify-center"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "註冊中..." : "註冊"}
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
          onClick={handleGoogleRegister}
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
          使用 Google 註冊
        </button>
      </div>
    </div>
  );
}
