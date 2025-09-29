import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@blackliving/ui';
import { useAuthStore } from '../../stores/authStore';
import TurnstileWidget from './TurnstileWidget';

const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8787';
const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || '';

type ModalState = 'form' | 'sent' | 'error';

interface MagicLinkModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated?: () => void;
}

export function MagicLinkModal({ open, onClose, onAuthenticated }: MagicLinkModalProps) {
  const { accessToken, accessTokenExpiresAt, setLastEmail, lastEmail, clearAuth } = useAuthStore();
  const [email, setEmail] = useState(lastEmail);
  const [state, setState] = useState<ModalState>('form');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [resendCount, setResendCount] = useState<number>(0);

  const isAuthenticated = useMemo(() => {
    if (!accessToken || !accessTokenExpiresAt) return false;
    return accessTokenExpiresAt > Date.now();
  }, [accessToken, accessTokenExpiresAt]);

  useEffect(() => {
    if (isAuthenticated && open) {
      onAuthenticated?.();
      onClose();
    }
  }, [isAuthenticated, onAuthenticated, onClose, open]);

  useEffect(() => {
    if (!open) {
      setState('form');
      setError(null);
      setIsSubmitting(false);
      setTurnstileToken(null);
      setCooldown(0);
    }
  }, [open]);

  useEffect(() => {
    setEmail(lastEmail);
  }, [lastEmail, open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleToken = useCallback((token: string | null) => {
    setTurnstileToken(token);
  }, []);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (isSubmitting) return;

      if (!email.trim()) {
        setError('請輸入 Email 位址');
        return;
      }

      if (!turnstileToken) {
        setError('請先完成驗證');
        return;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const response = await fetch(`${API_BASE}/api/auth/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, turnstileToken, redirectTo: window.location.href }),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.error || '驗證信寄送失敗，請稍後再試');
        }

        setLastEmail(email);
        setState('sent');
        setCooldown(60);
        setResendCount(count => count + 1);
      } catch (err) {
        console.error('Failed to initiate magic link', err);
        setState('error');
        setError(err instanceof Error ? err.message : '驗證信寄送失敗，請稍後再試');
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, isSubmitting, turnstileToken, setLastEmail]
  );

  const handleResend = useCallback(() => {
    setState('form');
    setError(null);
    setTurnstileToken(null);
    setCooldown(0);
    setIsSubmitting(false);
  }, []);

  const handleLogout = useCallback(() => {
    clearAuth();
    setState('form');
    setError(null);
  }, [clearAuth]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">登入以完成預約</h2>
            <p className="mt-1 text-sm text-gray-500">輸入 Email 並通過驗證後，我們會寄送一次性登入連結給您</p>
          </div>
          {isAuthenticated ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">已登入</span>
          ) : (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600">未登入</span>
          )}
        </div>

        {state === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700">
                Email 位址
              </label>
              <input
                id="magic-email"
                type="email"
                value={email}
                onChange={event => setEmail(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-base shadow-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="example@mail.com"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium text-gray-700">安全驗證</span>
              {TURNSTILE_SITE_KEY ? (
                <TurnstileWidget onToken={handleToken} siteKey={TURNSTILE_SITE_KEY} disabled={isSubmitting} />
              ) : (
                <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                  尚未設定 Turnstile Site Key，請聯絡網站管理員完成設定。
                </p>
              )}
            </div>

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <Button type="submit" disabled={isSubmitting || !TURNSTILE_SITE_KEY} className="w-full justify-center px-6 py-3 text-base">
              {isSubmitting ? '寄送中…' : '寄送登入連結'}
            </Button>

            {resendCount > 0 && (
              <button
                type="button"
                onClick={handleResend}
                className="w-full text-sm text-gray-500 underline hover:text-gray-700"
                disabled={isSubmitting || cooldown > 0}
              >
                需要重新驗證？{cooldown > 0 ? `請等待 ${cooldown} 秒後重試` : '重新發送驗證信'}
              </button>
            )}

            <p className="text-xs leading-6 text-gray-500">
              Magic Link 僅能使用一次，並會在 15 分鐘後失效。請確認郵件可能被分類到垃圾信件。
            </p>
          </form>
        )}

        {state === 'sent' && (
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">驗證信已寄出！</h3>
              <p className="mt-2 text-sm text-gray-600">
                請在 15 分鐘內點擊信中的一次性登入連結。完成後系統會自動帶您回到預約流程。
              </p>
            </div>
            <div className="space-y-3 text-sm text-gray-500">
              <p>寄送至：{email}</p>
              <p>若未收到，請檢查垃圾信件，或於稍後重新寄送。</p>
            </div>
            <Button onClick={handleResend} disabled={cooldown > 0} variant="outline" className="w-full justify-center">
              {cooldown > 0 ? `重新寄送 (${cooldown}s)` : '重新發送驗證信'}
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-sm text-gray-500 underline hover:text-gray-700"
            >
              已完成驗證？返回預約頁面
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 7a1 1 0 112 0v4a1 1 0 11-2 0V7zm1 7a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">驗證信寄送失敗</h3>
              <p className="mt-2 text-sm text-gray-600">{error ?? '請稍後重新嘗試，或聯絡客服協助。'}</p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleResend} className="w-full justify-center">
                重新嘗試寄送
              </Button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full text-sm text-gray-500 underline hover:text-gray-700"
              >
                切換其他 Email
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MagicLinkModal;