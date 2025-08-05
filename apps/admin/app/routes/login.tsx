import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@blackliving/ui';
import { Input } from '@blackliving/ui';
import { Label } from '@blackliving/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@blackliving/ui';
import { useAuth } from '../contexts/AuthContext';
import type { Route } from './+types/login';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Login - Black Living Admin' },
    { name: 'description', content: 'Login to Black Living Admin Dashboard' },
  ];
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError('登入失敗，請檢查您的帳號密碼或確認您有管理員權限');
      }
    } catch (err) {
      setError('登入時發生錯誤，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (err) {
      setError('Google 登入失敗，請稍後再試');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">黑哥家居管理後台</h2>
          <p className="mt-2 text-sm text-gray-600">請登入您的管理員帳號</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>管理員登入</CardTitle>
            <CardDescription>輸入您的帳號密碼或使用 Google 登入</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">電子郵件</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@blackliving.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="請輸入密碼"
                  required
                  disabled={loading}
                />
              </div>

              {error && <div className="text-red-600 text-sm text-center">{error}</div>}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登入中...' : '登入'}
              </Button>
            </form>

            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                使用 Google 登入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
